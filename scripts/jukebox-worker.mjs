#!/usr/bin/env node
/**
 * Harry Afters — jukebox worker.
 *
 * Long-lived process that runs on a home server. Reads the canonical queue
 * from Supabase, controls Spotify playback on the host's Premium account, and
 * writes the now_playing snapshot back so the website stays live.
 *
 * Why this lives outside the Nuxt app:
 *   - Vercel functions can't keep a 3-second loop running for hours.
 *   - The host's Spotify refresh token never has to leave your home network
 *     beyond the calls to api.spotify.com.
 *
 * Boot:
 *   1. Run the SQL in supabase/schema.sql (creates spotify_account + queue tables).
 *   2. Visit /api/admin/jukebox/spotify/login?token=NUXT_ADMIN_TOKEN once on the
 *      Vercel deploy. After Spotify redirects back you'll see "Jukebox linked".
 *   3. Drop these env vars into a local .env (next to this file or above it):
 *        NUXT_SUPABASE_URL=...
 *        NUXT_SUPABASE_SERVICE_KEY=...
 *        NUXT_SPOTIFY_CLIENT_ID=...
 *        NUXT_SPOTIFY_CLIENT_SECRET=...
 *      (NUXT_SPOTIFY_REDIRECT_URI is only needed for the bootstrap step.)
 *   4. `node --env-file=.env scripts/jukebox-worker.mjs`
 *      Keep it alive with pm2 / systemd / Windows Task Scheduler.
 *      (`--env-file` is built into Node 20+; no extra dependency needed.)
 *
 * Spotify quirks the loop must handle:
 *   - `POST /me/player/queue` is append-only. We forward one track at a time,
 *     only ~6s before the current one ends. To avoid double-adds (two ticks,
 *     two PM2 copies, or stale demotion + retry), we:
 *       1) Atomically claim the DB row (`queued` → `enqueued_spotify`) *before*
 *          calling Spotify, so only one winner can POST.
 *       2) `GET /me/player/queue` — if the URI is already next/current, skip POST.
 *   - Playback control requires an active device. If `GET /me/player` returns
 *     204 / no device, we idle until the host hits play on a device.
 *   - Premium-only. `403 PREMIUM_REQUIRED` will surface on play/queue calls.
 *   - When the jukebox track finishes (playback stops or Spotify advances to
 *     something else), we mark the `now_playing` row `played` so it disappears
 *     from the guest queue list — including the last song with nothing queued.
 *   - If Spotify is already playing a track that is still `queued` in the DB,
 *     we promote it to `now_playing` and never pick it again as "next" — avoids
 *     appending the same URI to Spotify's queue (repeat loop).
 *   - Spotify **repeat-one** blocks the next queued track forever (same URI keeps
 *     playing). We turn repeat **off** periodically unless JUKEBOX_ALLOW_SPOTIFY_REPEAT=1.
 *   - If an `enqueued_spotify` row never becomes current (repeat / skip / drift),
 *     we demote it back to `queued` after a short timeout outside the handoff window
 *     so new adds are not stuck behind a phantom "already enqueued" gate.
 */

import { createClient } from '@supabase/supabase-js'

const POLL_MS = Number(process.env.JUKEBOX_POLL_MS ?? 3000)
const LOOKAHEAD_MS = Number(process.env.JUKEBOX_LOOKAHEAD_MS ?? 6000)
/** Demote orphan enqueued_spotify after this age (ms) when not in handoff zone */
const STALE_ENQUEUE_MIN_MS = Number(process.env.JUKEBOX_STALE_ENQUEUE_MS ?? 18_000)
/** Extra cushion beyond LOOKAHEAD where we still treat playback as "about to hand off" */
const HANDOFF_BUFFER_MS = Number(process.env.JUKEBOX_HANDOFF_BUFFER_MS ?? 12_000)
const REPEAT_OFF_INTERVAL_MS = Number(process.env.JUKEBOX_REPEAT_OFF_INTERVAL_MS ?? 40_000)
const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token'

const env = {
  supabaseUrl: requireEnv('NUXT_SUPABASE_URL'),
  supabaseServiceKey: requireEnv('NUXT_SUPABASE_SERVICE_KEY'),
  spotifyClientId: requireEnv('NUXT_SPOTIFY_CLIENT_ID'),
  spotifyClientSecret: requireEnv('NUXT_SPOTIFY_CLIENT_SECRET')
}

const supabase = createClient(normaliseSupabaseUrl(env.supabaseUrl), env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

let cachedAccessToken = null // { token, expiresAt }
let cachedRefreshToken = null

/** Last progress sample per tick — detects repeat-one / seek-back on same track */
let lastProgressSample = { trackId: null, progressMs: -1 }
let lastRepeatOffAt = 0

let running = true
process.on('SIGINT', () => { running = false; log('Stopping…') })
process.on('SIGTERM', () => { running = false; log('Stopping…') })

main().catch((err) => {
  console.error('[jukebox-worker] fatal:', err)
  process.exit(1)
})

async function main() {
  log(`Starting (poll ${POLL_MS}ms, lookahead ${LOOKAHEAD_MS}ms)`)
  while (running) {
    try {
      await tick()
    } catch (err) {
      console.error('[jukebox-worker] tick failed:', err)
    }
    await sleep(POLL_MS)
  }
  log('Stopped.')
}

async function tick() {
  const refresh = await loadRefreshToken()
  if (!refresh) {
    // Nothing to do until the admin completes the OAuth bootstrap.
    await markIdle()
    return
  }

  const accessToken = await getAccessToken(refresh)
  const player = await fetchPlayer(accessToken)

  // No active device → clear stuck `now_playing` (e.g. last song finished),
  // then idle the snapshot.
  if (!player) {
    await finalizeEndedNowPlaying(null, null, null)
    await writeNowPlaying({
      queue_id: null,
      track_uri: null,
      track_id: null,
      track_name: null,
      artist: null,
      album_image: null,
      progress_ms: 0,
      duration_ms: 0,
      device_name: null,
      is_playing: false
    })
    return
  }

  // Snapshot back to Supabase first so the UI is responsive.
  const currentTrack = player.item?.type === 'track' ? player.item : null
  const playerTrackId = currentTrack?.id ?? null
  const playerTrackUri = currentTrack?.uri ?? null
  const progressMs = player.progress_ms ?? 0
  const durationMs = currentTrack?.duration_ms ?? 0

  await maybeSpotifyRepeatOff(accessToken)

  if (consumePlaybackRewind(playerTrackId, progressMs)) {
    log('Same track rewound (repeat/seek) — repeat off + clearing orphan enqueued rows')
    await spotifyRepeatOff(accessToken)
    lastRepeatOffAt = Date.now()
    if (playerTrackId) await demoteOrphanEnqueuedSpotify(playerTrackId)
  }

  // Spotify moved past our jukebox track → mark DB row `played` so it leaves the queue list.
  await finalizeEndedNowPlaying(player, playerTrackId, player.item?.type)

  // Reconcile: Spotify is on this track — if DB still says `queued` or
  // `enqueued_spotify`, promote to `now_playing` and bury the previous jukebox
  // track. (Queued-only rows happen after manual play / drift; without this we
  // would enqueue the same URI again and Spotify repeats the song.)
  if (playerTrackId) {
    const { data: matching } = await supabase
      .from('song_queue')
      .select('id, track_id, status')
      .eq('track_id', playerTrackId)
      .in('status', ['queued', 'enqueued_spotify', 'now_playing'])
      .maybeSingle()

    if (matching && matching.status !== 'now_playing') {
      await supabase
        .from('song_queue')
        .update({ status: 'played', played_at: new Date().toISOString() })
        .eq('status', 'now_playing')

      await supabase
        .from('song_queue')
        .update({ status: 'now_playing' })
        .eq('id', matching.id)
    }
  }

  await demoteStaleEnqueuedSpotify(playerTrackId, progressMs, durationMs)

  // If we have a now_playing row in the DB, surface it on the snapshot. We
  // prefer the DB row because it carries the album_image we showed the
  // requester (Spotify's `item.album.images` is also fine but consistency
  // wins).
  const { data: dbNow } = await supabase
    .from('song_queue')
    .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms')
    .eq('status', 'now_playing')
    .order('first_added_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  await writeNowPlaying({
    queue_id: dbNow?.id ?? null,
    track_uri: dbNow?.track_uri ?? playerTrackUri,
    track_id: dbNow?.track_id ?? playerTrackId,
    track_name: dbNow?.track_name ?? currentTrack?.name ?? null,
    artist: dbNow?.artist ?? formatArtists(currentTrack) ?? null,
    album_image: dbNow?.album_image ?? pickAlbumImage(currentTrack) ?? null,
    progress_ms: progressMs,
    duration_ms: dbNow?.duration_ms ?? durationMs,
    device_name: player.device?.name ?? null,
    is_playing: !!player.is_playing
  })

  // Honour admin skips: if the now_playing row was flipped to "skipped" we
  // press next on Spotify and let the next loop pick that up.
  const { data: pendingSkip } = await supabase
    .from('song_queue')
    .select('id, track_id')
    .eq('status', 'skipped')
    .gte('played_at', new Date(Date.now() - 60_000).toISOString())
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingSkip && playerTrackId === pendingSkip.track_id) {
    log(`Honouring admin skip on ${pendingSkip.track_id}`)
    await spotifyNext(accessToken)
    return
  }

  // Lookahead: if no row is currently `enqueued_spotify` and the playing
  // track is within LOOKAHEAD_MS of finishing, forward the top of the queue.
  if (durationMs > 0 && durationMs - progressMs <= LOOKAHEAD_MS) {
    const { data: alreadyEnqueued } = await supabase
      .from('song_queue')
      .select('id')
      .eq('status', 'enqueued_spotify')
      .limit(1)
      .maybeSingle()

    if (!alreadyEnqueued) {
      let nextQuery = supabase
        .from('song_queue')
        .select('id, track_uri, track_name, artist')
        .eq('status', 'queued')
      if (playerTrackId) {
        nextQuery = nextQuery.neq('track_id', playerTrackId)
      }
      const { data: next } = await nextQuery
        .order('votes', { ascending: false })
        .order('first_added_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (next) {
        const claimed = await claimQueuedRowForSpotify(next.id)
        if (claimed) {
          const uri = claimed.track_uri
          const alreadyThere = await spotifyUriAlreadyInPlaybackQueue(accessToken, uri)
          if (alreadyThere) {
            log(`Skipping Spotify POST — URI already in playback queue: ${claimed.track_name}`)
          } else {
            log(`Forwarding to Spotify queue: ${claimed.track_name} — ${claimed.artist}`)
            const ok = await spotifyEnqueue(accessToken, uri)
            if (!ok) await revertClaimToQueued(claimed.id)
          }
        }
      }
    }
  }
}

/* ----- Supabase helpers ----- */

async function loadRefreshToken() {
  if (cachedRefreshToken) return cachedRefreshToken
  const { data, error } = await supabase
    .from('spotify_account')
    .select('refresh_token')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.warn('[jukebox-worker] could not read spotify_account:', error.message)
    return null
  }
  if (!data?.refresh_token) return null
  cachedRefreshToken = data.refresh_token
  return cachedRefreshToken
}

async function writeNowPlaying(snapshot) {
  const { error } = await supabase
    .from('now_playing')
    .update({ ...snapshot, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) {
    console.warn('[jukebox-worker] now_playing update failed:', error.message)
  }
}

async function markIdle() {
  await writeNowPlaying({
    queue_id: null,
    track_uri: null,
    track_id: null,
    track_name: null,
    artist: null,
    album_image: null,
    progress_ms: 0,
    duration_ms: 0,
    device_name: null,
    is_playing: false
  })
}

/** Mark the single `now_playing` row `played` when it is safe (id + status guard). */
async function markQueueRowPlayed(id) {
  const { error } = await supabase
    .from('song_queue')
    .update({
      status: 'played',
      played_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'now_playing')
  if (error) {
    console.warn('[jukebox-worker] markQueueRowPlayed failed:', error.message)
  }
}

/**
 * When Spotify no longer reflects our jukebox "now playing" row, mark it done
 * so GET /api/jukebox/queue stops listing it (including the last song).
 */
async function finalizeEndedNowPlaying(player, playerTrackId, itemType) {
  const { data: dbPlaying } = await supabase
    .from('song_queue')
    .select('id, track_id')
    .eq('status', 'now_playing')
    .order('first_added_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!dbPlaying) return

  if (!player) {
    log(`Marked queue row played (no active Spotify player): ${dbPlaying.track_id}`)
    await markQueueRowPlayed(dbPlaying.id)
    return
  }

  if (itemType && itemType !== 'track') {
    log(`Marked queue row played (non-track context): ${dbPlaying.track_id}`)
    await markQueueRowPlayed(dbPlaying.id)
    return
  }

  if (playerTrackId && playerTrackId !== dbPlaying.track_id) {
    log(`Marked queue row played (Spotify now on another track): ${dbPlaying.track_id}`)
    await demoteOrphanEnqueuedSpotify(playerTrackId)
    await markQueueRowPlayed(dbPlaying.id)
  }
}

/** Rewind `enqueued_spotify` rows that are not the track Spotify actually moved to (skipped / radio). */
async function demoteOrphanEnqueuedSpotify(currentTrackId) {
  if (!currentTrackId) return
  const { error } = await supabase
    .from('song_queue')
    .update({ status: 'queued', enqueued_at: null })
    .eq('status', 'enqueued_spotify')
    .neq('track_id', currentTrackId)
  if (error) {
    console.warn('[jukebox-worker] demoteOrphanEnqueuedSpotify failed:', error.message)
  }
}

/* ----- Spotify helpers ----- */

async function getAccessToken(refreshToken) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token
  }
  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('refresh_token', refreshToken)
  const res = await fetch(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.spotifyClientId}:${env.spotifyClientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Spotify token refresh failed (${res.status}): ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  cachedAccessToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000
  }
  if (json.refresh_token && json.refresh_token !== refreshToken) {
    // Spotify rotates refresh tokens occasionally — persist the new one.
    cachedRefreshToken = json.refresh_token
    await supabase
      .from('spotify_account')
      .update({
        refresh_token: json.refresh_token,
        scope: String(json.scope ?? ''),
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
  }
  return cachedAccessToken.token
}

async function fetchPlayer(accessToken) {
  const res = await fetch(`${SPOTIFY_API}/me/player`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET /me/player failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return await res.json()
}

/** Single-flight guard: only one process/tick can move `queued` → `enqueued_spotify`. */
async function claimQueuedRowForSpotify(rowId) {
  const enqueuedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('song_queue')
    .update({ status: 'enqueued_spotify', enqueued_at: enqueuedAt })
    .eq('id', rowId)
    .eq('status', 'queued')
    .select('id, track_uri, track_name, artist')
    .maybeSingle()

  if (error) {
    console.warn('[jukebox-worker] claimQueuedRowForSpotify:', error.message)
    return null
  }
  return data ?? null
}

async function revertClaimToQueued(rowId) {
  const { error } = await supabase
    .from('song_queue')
    .update({ status: 'queued', enqueued_at: null })
    .eq('id', rowId)
    .eq('status', 'enqueued_spotify')

  if (error) {
    console.warn('[jukebox-worker] revertClaimToQueued:', error.message)
  }
}

function normalizeSpotifyUri(uri) {
  return String(uri ?? '').trim()
}

/** True if Spotify already has this track as current or queued (avoids duplicate POST). */
async function spotifyUriAlreadyInPlaybackQueue(accessToken, trackUri) {
  const want = normalizeSpotifyUri(trackUri)
  if (!want) return false

  const res = await fetch(`${SPOTIFY_API}/me/player/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 204 || !res.ok) return false

  let json
  try {
    json = await res.json()
  } catch {
    return false
  }

  const cur = json.currently_playing?.uri
  if (cur && normalizeSpotifyUri(cur) === want) return true

  for (const item of json.queue ?? []) {
    const u = item?.uri
    if (u && normalizeSpotifyUri(u) === want) return true
  }

  return false
}

async function spotifyEnqueue(accessToken, uri) {
  const url = new URL(`${SPOTIFY_API}/me/player/queue`)
  url.searchParams.set('uri', uri)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 204) return true
  const text = await res.text().catch(() => '')
  console.warn(`[jukebox-worker] /queue ${res.status}: ${text.slice(0, 200)}`)
  return false
}

async function spotifyNext(accessToken) {
  const res = await fetch(`${SPOTIFY_API}/me/player/next`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    console.warn(`[jukebox-worker] /next ${res.status}: ${text.slice(0, 200)}`)
  }
}

/** Repeat-one prevents the Spotify queue from advancing; jukebox relies on linear playback. */
async function spotifyRepeatOff(accessToken) {
  const res = await fetch(`${SPOTIFY_API}/me/player/repeat?state=off`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    console.warn(`[jukebox-worker] repeat off ${res.status}: ${text.slice(0, 200)}`)
  }
}

async function maybeSpotifyRepeatOff(accessToken) {
  if (process.env.JUKEBOX_ALLOW_SPOTIFY_REPEAT === '1') return
  if (Date.now() - lastRepeatOffAt < REPEAT_OFF_INTERVAL_MS) return
  lastRepeatOffAt = Date.now()
  await spotifyRepeatOff(accessToken)
}

/**
 * `enqueued_spotify` for track Y while Spotify still plays X blocks lookahead forever.
 * When we're clearly not in the X→Y handoff window and Y has waited too long, demote Y.
 */
async function demoteStaleEnqueuedSpotify(playerTrackId, progressMs, durationMs) {
  const { data: rows, error } = await supabase
    .from('song_queue')
    .select('id, track_id, enqueued_at')
    .eq('status', 'enqueued_spotify')

  if (error || !rows?.length) return

  const remaining = durationMs > 0 ? durationMs - progressMs : Number.POSITIVE_INFINITY
  const inHandoffZone = remaining <= LOOKAHEAD_MS + HANDOFF_BUFFER_MS

  for (const row of rows) {
    if (!playerTrackId || row.track_id === playerTrackId) continue

    const enqueuedAt = row.enqueued_at ? new Date(row.enqueued_at).getTime() : 0
    const ageMs = Date.now() - enqueuedAt
    if (ageMs < STALE_ENQUEUE_MIN_MS) continue
    if (inHandoffZone) continue

    await supabase
      .from('song_queue')
      .update({ status: 'queued', enqueued_at: null })
      .eq('id', row.id)

    log(`Demoted stale enqueued_spotify → queued (${row.track_id}, waited ${Math.round(ageMs / 1000)}s)`)
  }
}

function consumePlaybackRewind(trackId, progressMs) {
  if (!trackId || typeof progressMs !== 'number') {
    lastProgressSample = { trackId: null, progressMs: -1 }
    return false
  }

  let rewound = false
  if (
    lastProgressSample.trackId === trackId &&
    lastProgressSample.progressMs >= 0 &&
    progressMs + 3000 < lastProgressSample.progressMs
  ) {
    rewound = true
  }

  lastProgressSample = { trackId, progressMs }
  return rewound
}

/* ----- helpers ----- */

function pickAlbumImage(track) {
  const images = track?.album?.images ?? []
  if (images.length === 0) return null
  const mid = images.find(i => (i.width ?? 0) >= 200 && (i.width ?? 0) <= 400)
  return (mid ?? images[images.length - 1] ?? images[0])?.url ?? null
}

function formatArtists(track) {
  if (!track?.artists) return null
  return track.artists.map(a => a?.name).filter(Boolean).join(', ')
}

function normaliseSupabaseUrl(input) {
  let u = String(input).trim().replace(/\/+$/, '')
  u = u.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  return u
}

function requireEnv(key) {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env: ${key}`)
  return v
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(msg) {
  console.log(`[jukebox-worker ${new Date().toISOString()}] ${msg}`)
}
