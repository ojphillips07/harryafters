/**
 * POST /api/admin/jukebox/remove
 *
 * Body: { queueId: string }
 * Auth: `x-admin-token` header.
 *
 * Marks a queued (or already-enqueued-on-Spotify) row as `removed` so the
 * worker won't forward it. If it's already past Spotify's lookahead we can't
 * un-queue it on Spotify, but the worker won't track it as `now_playing` and
 * the UI will hide it.
 */

interface RemoveBody {
  queueId?: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  const body = await readBody<RemoveBody>(event)
  const queueId = typeof body?.queueId === 'string' ? body.queueId.trim() : ''
  if (!UUID_RE.test(queueId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid queueId.' })
  }

  const supabase = useSupabaseAdmin()
  const { data: row, error } = await supabase
    .from('song_queue')
    .update({ status: 'removed' })
    .eq('id', queueId)
    .in('status', ['queued', 'enqueued_spotify'])
    .select('id, track_name, artist, status')
    .maybeSingle()

  if (error) {
    console.error('[admin/jukebox/remove] update failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not remove track.' })
  }
  if (!row) {
    return { ok: false, note: 'Track not removable (already played, removed, or playing).' }
  }
  return { ok: true, row }
})
