/**
 * GET /api/jukebox/search?q=...
 *
 * Public Spotify track search. Uses the server-cached client_credentials token
 * (no user login required). Rate-limited per IP because guests hammer this
 * endpoint as they type.
 */

import { searchTracks } from '../../utils/spotify'
import { getClientIp, rateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q ?? '').trim()
  if (!q) {
    return { tracks: [] }
  }
  if (q.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Query too long.' })
  }

  const ip = getClientIp(event)
  const rl = rateLimit(`jukebox:search:${ip}`, 30, 10_000)
  if (!rl.allowed) {
    throw createError({ statusCode: 429, statusMessage: 'Too many searches — slow down.' })
  }

  const tracks = await searchTracks(q, 10)
  return { tracks }
})
