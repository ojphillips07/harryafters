/**
 * POST /api/jukebox/queue
 *
 * Body: { trackId, trackUri, trackName, artist, albumImage?, durationMs, deviceId }
 *
 * Behaviour:
 *  - If no active row exists for `trackId`, insert a new `song_queue` row with
 *    `votes = 1` and a matching `song_votes` row.
 *  - If an active row exists, attempt to insert the `song_votes` row. If the
 *    insert succeeds (this device hasn't voted before) we increment
 *    `song_queue.votes` and bump `last_voted_at`. If it fails on the PK conflict
 *    we return the existing row + `alreadyVoted: true`.
 *
 * Per-device add limiter prevents one phone from spamming a hundred unique tracks.
 */

import { rateLimit } from '../../utils/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TRACK_ID_RE = /^[A-Za-z0-9]{20,40}$/
const TRACK_URI_RE = /^spotify:track:[A-Za-z0-9]{20,40}$/

interface AddBody {
  trackId?: unknown
  trackUri?: unknown
  trackName?: unknown
  artist?: unknown
  albumImage?: unknown
  durationMs?: unknown
  deviceId?: unknown
}

function clampString(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AddBody>(event)

  const trackId = clampString(body?.trackId, 64)
  const trackUri = clampString(body?.trackUri, 80)
  const trackName = clampString(body?.trackName, 200)
  const artist = clampString(body?.artist, 200)
  const albumImageRaw = clampString(body?.albumImage, 500)
  const albumImage = albumImageRaw && /^https?:\/\//i.test(albumImageRaw) ? albumImageRaw : null
  const durationMs = Math.round(Number(body?.durationMs))
  const deviceId = clampString(body?.deviceId, 64)

  if (!TRACK_ID_RE.test(trackId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid trackId.' })
  }
  if (!TRACK_URI_RE.test(trackUri)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid trackUri.' })
  }
  if (!trackName || !artist) {
    throw createError({ statusCode: 400, statusMessage: 'Missing track metadata.' })
  }
  if (!Number.isFinite(durationMs) || durationMs < 5_000 || durationMs > 30 * 60 * 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid track duration.' })
  }
  if (!UUID_RE.test(deviceId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid deviceId.' })
  }

  const rl = rateLimit(`jukebox:add:${deviceId}`, 8, 60_000)
  if (!rl.allowed) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests — give it a sec.' })
  }

  const supabase = useSupabaseAdmin()

  // Look up the active row for this track (queued / enqueued_spotify / now_playing).
  const { data: existing, error: lookupError } = await supabase
    .from('song_queue')
    .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
    .eq('track_id', trackId)
    .in('status', ['queued', 'enqueued_spotify', 'now_playing'])
    .maybeSingle()

  if (lookupError) {
    console.error('[jukebox/queue.post] lookup failed', lookupError)
    throw createError({ statusCode: 500, statusMessage: 'Could not look up queue.' })
  }

  if (existing) {
    const queueId = existing.id as string

    // Idempotent vote insert — PK on (queue_id, device_id) blocks duplicates.
    const { error: voteError } = await supabase
      .from('song_votes')
      .insert({ queue_id: queueId, device_id: deviceId })

    if (voteError && voteError.code !== '23505') {
      console.error('[jukebox/queue.post] vote insert failed', voteError)
      throw createError({ statusCode: 500, statusMessage: 'Could not record vote.' })
    }

    if (voteError && voteError.code === '23505') {
      return { ok: true, alreadyVoted: true, row: existing }
    }

    const { data: bumped, error: bumpError } = await supabase
      .from('song_queue')
      .update({
        votes: (existing.votes as number) + 1,
        last_voted_at: new Date().toISOString()
      })
      .eq('id', queueId)
      .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
      .single()

    if (bumpError) {
      console.error('[jukebox/queue.post] vote bump failed', bumpError)
      throw createError({ statusCode: 500, statusMessage: 'Could not bump track.' })
    }

    return { ok: true, alreadyVoted: false, row: bumped }
  }

  // First request for this track — insert queue row + vote together.
  const { data: inserted, error: insertError } = await supabase
    .from('song_queue')
    .insert({
      track_id: trackId,
      track_uri: trackUri,
      track_name: trackName,
      artist,
      album_image: albumImage,
      duration_ms: durationMs,
      votes: 1,
      status: 'queued'
    })
    .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      // Race condition: someone else just inserted the same track. Retry as a vote.
      const { data: raceRow } = await supabase
        .from('song_queue')
        .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
        .eq('track_id', trackId)
        .in('status', ['queued', 'enqueued_spotify', 'now_playing'])
        .maybeSingle()
      if (raceRow) {
        const { error: raceVoteErr } = await supabase
          .from('song_votes')
          .insert({ queue_id: raceRow.id, device_id: deviceId })
        if (raceVoteErr && raceVoteErr.code === '23505') {
          return { ok: true, alreadyVoted: true, row: raceRow }
        }
        if (raceVoteErr) {
          console.error('[jukebox/queue.post] race vote insert failed', raceVoteErr)
          throw createError({ statusCode: 500, statusMessage: 'Could not record vote.' })
        }
        const { data: raceBumped, error: raceBumpErr } = await supabase
          .from('song_queue')
          .update({
            votes: (raceRow.votes as number) + 1,
            last_voted_at: new Date().toISOString()
          })
          .eq('id', raceRow.id)
          .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
          .single()
        if (raceBumpErr) {
          console.error('[jukebox/queue.post] race bump failed', raceBumpErr)
          throw createError({ statusCode: 500, statusMessage: 'Could not bump track.' })
        }
        return { ok: true, alreadyVoted: false, row: raceBumped }
      }
    }
    console.error('[jukebox/queue.post] queue insert failed', insertError)
    throw createError({ statusCode: 500, statusMessage: 'Could not add to queue.' })
  }

  await supabase
    .from('song_votes')
    .insert({ queue_id: inserted.id, device_id: deviceId })

  return { ok: true, alreadyVoted: false, row: inserted }
})
