/**
 * Spotify Web API helpers.
 *
 * Two flows are used here:
 *
 * 1. **Client Credentials** (`getSpotifyAppToken`): server-side token with no user context.
 *    Used for `GET /search` so guests can find tracks without anyone logging in.
 *
 * 2. **Authorization Code** (admin OAuth bootstrap, see /api/admin/jukebox/spotify/...):
 *    captures a long-lived `refresh_token` for the host's Premium account into
 *    `public.spotify_account`. The home-server worker reads that row and uses
 *    `refreshUserAccessToken` to get short-lived access tokens for playback control.
 *
 * Required Spotify scopes for the host account:
 *   user-modify-playback-state user-read-playback-state user-read-currently-playing
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'

interface SpotifyAppToken {
  accessToken: string
  /** Epoch ms after which the cached token must be refreshed. */
  expiresAt: number
}

let appTokenCache: SpotifyAppToken | null = null

function getSpotifyAuthHeader(): string {
  const config = useRuntimeConfig()
  const id = String(config.spotifyClientId ?? '').trim()
  const secret = String(config.spotifyClientSecret ?? '').trim()
  if (!id || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Spotify is not configured (missing NUXT_SPOTIFY_CLIENT_ID / NUXT_SPOTIFY_CLIENT_SECRET).'
    })
  }
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
}

/** Server-cached client_credentials token. Used for /search only (no user context). */
export async function getSpotifyAppToken(): Promise<string> {
  if (appTokenCache && appTokenCache.expiresAt > Date.now() + 30_000) {
    return appTokenCache.accessToken
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': getSpotifyAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `Spotify token request failed (${res.status}): ${text.slice(0, 200)}`
    })
  }
  const json = (await res.json()) as { access_token: string, expires_in: number }
  appTokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000
  }
  return appTokenCache.accessToken
}

/** Lean track shape returned to the website (what we need to enqueue). */
export interface SpotifyTrack {
  trackId: string
  trackUri: string
  trackName: string
  artist: string
  albumImage: string | null
  durationMs: number
  explicit: boolean
}

interface SpotifySearchTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  explicit: boolean
  artists: Array<{ name: string }>
  album?: { images?: Array<{ url: string, width?: number, height?: number }> }
}

interface SpotifySearchResponse {
  tracks: { items: SpotifySearchTrack[] }
}

/** Pick a square-ish ~300px album image for the UI. */
function pickAlbumImage(t: SpotifySearchTrack): string | null {
  const images = t.album?.images ?? []
  if (images.length === 0) return null
  const mid = images.find(i => (i.width ?? 0) >= 200 && (i.width ?? 0) <= 400)
  return (mid ?? images[images.length - 1] ?? images[0]).url
}

export function toSpotifyTrack(t: SpotifySearchTrack): SpotifyTrack {
  return {
    trackId: t.id,
    trackUri: t.uri,
    trackName: t.name,
    artist: t.artists.map(a => a.name).filter(Boolean).join(', '),
    albumImage: pickAlbumImage(t),
    durationMs: t.duration_ms,
    explicit: t.explicit
  }
}

export async function searchTracks(query: string, limit = 10, market = 'GB'): Promise<SpotifyTrack[]> {
  const q = query.trim()
  if (!q) return []

  const token = await getSpotifyAppToken()
  const url = new URL(`${API_BASE}/search`)
  url.searchParams.set('q', q)
  url.searchParams.set('type', 'track')
  url.searchParams.set('limit', String(Math.max(1, Math.min(20, limit))))
  url.searchParams.set('market', market)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `Spotify search failed (${res.status}): ${text.slice(0, 200)}`
    })
  }
  const json = (await res.json()) as SpotifySearchResponse
  return (json.tracks?.items ?? []).map(toSpotifyTrack)
}

/* ---------------------------------------------------------------------------
 * User-authorised flow (admin OAuth bootstrap + worker)
 *
 * The website only ever calls the bootstrap endpoints. The home-server worker
 * is what actually controls playback — it imports these helpers via its own
 * standalone copy (see scripts/jukebox-worker.mjs) so the Vercel function
 * runtime never needs to touch the user's Spotify account.
 * --------------------------------------------------------------------------- */

export interface SpotifyTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope: string
}

/** Build the URL for the one-time admin login with required scopes + state. */
export function buildAuthorizeUrl(state: string): string {
  const config = useRuntimeConfig()
  const id = String(config.spotifyClientId ?? '').trim()
  const redirect = String(config.spotifyRedirectUri ?? '').trim()
  if (!id || !redirect) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Spotify is not configured (missing NUXT_SPOTIFY_CLIENT_ID / NUXT_SPOTIFY_REDIRECT_URI).'
    })
  }
  const scope = 'user-modify-playback-state user-read-playback-state user-read-currently-playing'
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.set('client_id', id)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirect)
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  url.searchParams.set('show_dialog', 'true')
  return url.toString()
}

export async function exchangeAuthorizationCode(code: string): Promise<SpotifyTokenResponse> {
  const config = useRuntimeConfig()
  const redirect = String(config.spotifyRedirectUri ?? '').trim()
  const params = new URLSearchParams()
  params.set('grant_type', 'authorization_code')
  params.set('code', code)
  params.set('redirect_uri', redirect)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': getSpotifyAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `Spotify token exchange failed (${res.status}): ${text.slice(0, 200)}`
    })
  }
  return (await res.json()) as SpotifyTokenResponse
}

/** Used by the worker. Exchanges a refresh_token for a fresh access_token. */
export async function refreshUserAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('refresh_token', refreshToken)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': getSpotifyAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `Spotify token refresh failed (${res.status}): ${text.slice(0, 200)}`
    })
  }
  return (await res.json()) as SpotifyTokenResponse
}
