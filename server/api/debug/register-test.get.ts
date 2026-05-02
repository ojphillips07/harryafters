/**
 * GET /api/debug/register-test
 *
 * Dev-only: tries Supabase + Resend with your configured secrets (no values returned).
 * Use after `/api/debug/register-env` — confirms keys work, not just that env vars exist.
 */

export default defineEventHandler(async () => {
  if (import.meta.prod) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const config = useRuntimeConfig()

  type Ok = { ok: true }
  type Fail = { ok: false; message: string; hint?: string }

  let supabase: Ok | Fail = { ok: false, message: 'Not configured' }
  let resend: Ok | Fail | { ok: true; audienceName: string } = { ok: false, message: 'Not configured' }

  if (config.supabaseUrl && config.supabaseServiceKey) {
    try {
      const sb = useSupabaseAdmin()
      const { error } = await sb.from('registrations').select('id').limit(1)
      if (error) {
        supabase = {
          ok: false,
          message: error.message,
          hint:
            error.code === 'PGRST205' || error.message.includes('schema cache')
              ? 'Table `registrations` may be missing — create it in Supabase SQL editor.'
              : error.message.includes('JWT') || error.message.includes('Invalid API key')
                ? 'Wrong key or URL — use project root URL only (`https://….supabase.co`, not `…/rest/v1`) plus Secret key (`sb_secret_…`) or legacy service_role JWT.'
                : undefined
        }
      } else {
        supabase = { ok: true }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      supabase = { ok: false, message: msg }
    }
  }

  if (config.resendApiKey && config.resendAudienceId) {
    try {
      const { client, audienceId } = useResend()
      const r = await client.audiences.get(audienceId)
      if (r.error) {
        resend = {
          ok: false,
          message: r.error.message,
          hint:
            r.error.name === 'not_found'
              ? 'Audience/segment ID not found — copy the ID from Resend → Audiences (or Segments) for the list you want.'
              : r.error.name === 'invalid_api_key' || r.error.name === 'missing_api_key'
                ? 'API key rejected — create a full API key in Resend → API Keys (starts with `re_`).'
                : undefined
        }
      } else if (r.data) {
        resend = { ok: true, audienceName: r.data.name }
      } else {
        resend = { ok: false, message: 'Empty response from Resend' }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      resend = { ok: false, message: msg }
    }
  }

  return {
    hint: 'Both integrations should show ok: true. Fix hints, restart dev server, retry.',
    supabase,
    resend
  }
})
