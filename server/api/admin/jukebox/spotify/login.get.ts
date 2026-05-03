/**
 * GET /api/admin/jukebox/spotify/login?token=<NUXT_ADMIN_TOKEN>
 *
 * One-time bootstrap step. Visit this URL in a browser while signed into the
 * Premium Spotify account that should host the jukebox. Spotify redirects back
 * to /callback which writes the refresh token into `public.spotify_account`.
 *
 * Auth: admin token via `?token=` query param (since the redirect is initiated
 * by a manual click, we can't use the `x-admin-token` header here). Spotify’s
 * own `state` covers CSRF on the round-trip.
 */

import { randomBytes } from 'node:crypto'
import { buildAuthorizeUrl } from '../../../../utils/spotify'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminToken = String(config.adminToken ?? '')
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ADMIN_TOKEN is not configured.' })
  }

  const supplied = String(getQuery(event).token ?? '')
  if (supplied !== adminToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized.' })
  }

  // CSRF: random state echoed by Spotify and verified in /callback via cookie.
  const state = randomBytes(24).toString('hex')
  setCookie(event, 'ha_spotify_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 600
  })

  return sendRedirect(event, buildAuthorizeUrl(state), 302)
})
