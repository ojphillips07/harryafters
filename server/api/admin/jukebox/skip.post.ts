/**
 * POST /api/admin/jukebox/skip
 *
 * Auth: `x-admin-token` header (same as /api/admin/check-in).
 * Marks the current `now_playing` row as `skipped`. The home-server worker
 * notices the status change and calls `POST /me/player/next` on Spotify.
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminToken = String(config.adminToken ?? '')
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ADMIN_TOKEN is not configured.' })
  }
  const supplied = getRequestHeader(event, 'x-admin-token')
  if (supplied !== adminToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized.' })
  }

  const supabase = useSupabaseAdmin()

  const { data: current, error: lookupError } = await supabase
    .from('song_queue')
    .select('id, track_name, artist')
    .eq('status', 'now_playing')
    .order('first_added_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error('[admin/jukebox/skip] lookup failed', lookupError)
    throw createError({ statusCode: 500, statusMessage: 'Could not look up now playing.' })
  }

  if (!current) {
    return { ok: true, skipped: null, note: 'Nothing playing.' }
  }

  const { error: updateError } = await supabase
    .from('song_queue')
    .update({ status: 'skipped', played_at: new Date().toISOString() })
    .eq('id', current.id)

  if (updateError) {
    console.error('[admin/jukebox/skip] update failed', updateError)
    throw createError({ statusCode: 500, statusMessage: 'Could not skip track.' })
  }

  return { ok: true, skipped: current }
})
