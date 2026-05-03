/**
 * GET /api/jukebox/now-playing
 *
 * Returns the snapshot the home-server worker last wrote into `now_playing`.
 * The website polls Realtime for live updates; this endpoint is what hydrates
 * the page on first load.
 */

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('now_playing')
    .select('queue_id, track_uri, track_id, track_name, artist, album_image, progress_ms, duration_ms, device_name, is_playing, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[jukebox/now-playing] fetch failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not load now-playing.' })
  }

  return { nowPlaying: data ?? null }
})
