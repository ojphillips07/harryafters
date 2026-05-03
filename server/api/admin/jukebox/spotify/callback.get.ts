/**
 * GET /api/admin/jukebox/spotify/callback?code=...&state=...
 *
 * Spotify redirects back here after the admin completes the OAuth dance.
 * We verify the `state` cookie set by /login, then exchange the code for a
 * refresh token and store it in `public.spotify_account` (singleton id = 1).
 */

import { exchangeAuthorizationCode } from '../../../../utils/spotify'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = String(query.code ?? '')
  const state = String(query.state ?? '')
  const error = String(query.error ?? '')

  const cookieState = getCookie(event, 'ha_spotify_state') ?? ''
  setCookie(event, 'ha_spotify_state', '', { path: '/', maxAge: 0 })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: `Spotify rejected the request: ${error}` })
  }
  if (!code || !state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code or state.' })
  }
  if (!cookieState || cookieState !== state) {
    throw createError({ statusCode: 400, statusMessage: 'State mismatch — restart the login from /api/admin/jukebox/spotify/login.' })
  }

  const tokens = await exchangeAuthorizationCode(code)
  if (!tokens.refresh_token) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Spotify did not return a refresh token. Try again with show_dialog=true (already enabled).'
    })
  }

  const supabase = useSupabaseAdmin()
  const { error: upsertError } = await supabase
    .from('spotify_account')
    .upsert(
      {
        id: 1,
        refresh_token: tokens.refresh_token,
        scope: String(tokens.scope ?? ''),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
  if (upsertError) {
    console.error('[spotify/callback] upsert failed', upsertError)
    throw createError({ statusCode: 500, statusMessage: 'Could not store Spotify refresh token.' })
  }

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Jukebox linked</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0b10; color: #f5f5f5;
           min-height: 100dvh; margin: 0; display: grid; place-items: center; padding: 24px; }
    .card { max-width: 420px; padding: 28px; border-radius: 16px;
            border: 1px solid rgba(16,185,129,0.4); background: rgba(16,185,129,0.08); }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p  { margin: 0 0 8px; color: rgba(245,245,245,0.8); line-height: 1.5; }
    code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Jukebox linked &#10003;</h1>
    <p>Spotify refresh token saved. The home-server worker can now control playback on this account.</p>
    <p>Scopes granted: <code>${tokens.scope}</code></p>
    <p>You can close this tab and start the worker (<code>node scripts/jukebox-worker.mjs</code>).</p>
  </div>
</body>
</html>`
})
