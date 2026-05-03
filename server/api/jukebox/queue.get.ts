/**
 * GET /api/jukebox/queue
 *
 * Initial fetch of the visible queue. The website then keeps it in sync via
 * Supabase Realtime; we still expose this endpoint so the page renders on first
 * load (and clients without Realtime can poll).
 *
 * Optional `deviceId` query param: when supplied, the response includes the set
 * of queue ids this device has already voted for so the UI can dim its "+1"
 * button.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseAdmin()

  const deviceIdRaw = String(getQuery(event).deviceId ?? '').trim()
  const deviceId = UUID_RE.test(deviceIdRaw) ? deviceIdRaw : null

  const { data: rows, error } = await supabase
    .from('song_queue')
    .select('id, track_id, track_uri, track_name, artist, album_image, duration_ms, votes, status, first_added_at, last_voted_at')
    .in('status', ['queued', 'enqueued_spotify', 'now_playing'])
    .order('votes', { ascending: false })
    .order('first_added_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('[jukebox/queue] fetch failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not load queue.' })
  }

  let votedIds: string[] = []
  if (deviceId && rows && rows.length > 0) {
    const { data: votes } = await supabase
      .from('song_votes')
      .select('queue_id')
      .eq('device_id', deviceId)
      .in('queue_id', rows.map(r => r.id))
    votedIds = (votes ?? []).map(v => v.queue_id as string)
  }

  return {
    queue: rows ?? [],
    votedIds
  }
})
