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
 *   - `POST /me/player/queue` is append-only. Once a track is forwarded we
 *     can't reorder or remove it on Spotify's side. So we forward exactly one
 *     track at a time, only ~6s before the current one ends, so guests can
 *     keep voting up rivals right until the lookahead window.
 *   - Playback control requires an active device. If `GET /me/player` returns
 *     204 / no device, we idle until the host hits play on a device.
 *   - Premium-only. `403 PREMIUM_REQUIRED` will surface on play/queue calls.
 */

import { createClient } from '@supabase/supabase-js'

const POLL_MS = Number(process.env.JUKEBOX_POLL_MS ?? 3000)
const LOOKAHEAD_MS = Number(process.env.JUKEBOX_LOOKAHEAD_MS ?? 6000)
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

  // No active device → idle, but keep the previous now_playing snapshot until
  // we have something to say.
  if (!player) {
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

  // Reconcile statuses: if Spotify is now playing a track that matches a
  // queue row we previously enqueued, flip that row to now_playing and bury
  // the previous row.
  if (playerTrackId) {
    const { data: matching } = await supabase
      .from('song_queue')
      .select('id, track_id, status')
      .eq('track_id', playerTrackId)
      .in('status', ['enqueued_spotify', 'now_playing'])
      .maybeSingle()

    if (matching && matching.status === 'enqueued_spotify') {
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
      const { data: next } = await supabase
        .from('song_queue')
        .select('id, track_uri, track_name, artist')
        .eq('status', 'queued')
        .order('votes', { ascending: false })
        .order('first_added_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (next) {
        log(`Forwarding to Spotify queue: ${next.track_name} — ${next.artist}`)
        const ok = await spotifyEnqueue(accessToken, next.track_uri)
        if (ok) {
          await supabase
            .from('song_queue')
            .update({ status: 'enqueued_spotify', enqueued_at: new Date().toISOString() })
            .eq('id', next.id)
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
