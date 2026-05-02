import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: { client: SupabaseClient; url: string; key: string } | null = null

/**
 * Project URL only: `https://<ref>.supabase.co`
 * Strips `/rest/v1` if the user pasted the full REST base (otherwise the JS
 * client builds `.../rest/v1/rest/v1/...` and PostgREST returns PGRST125).
 */
export function normalizeSupabaseUrl(input: string): string {
  let u = input.trim().replace(/\/+$/, '')
  u = u.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  return u
}

/** Server-side Supabase client using the service role key. NEVER expose to the browser. */
export function useSupabaseAdmin(): SupabaseClient {
  const config = useRuntimeConfig()
  const url = normalizeSupabaseUrl(String(config.supabaseUrl ?? ''))
  const key = String(config.supabaseServiceKey ?? '')

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured (missing NUXT_SUPABASE_URL or NUXT_SUPABASE_SERVICE_KEY).'
    })
  }

  if (cached?.url === url && cached?.key === key) {
    return cached.client
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  cached = { client, url, key }
  return client
}
