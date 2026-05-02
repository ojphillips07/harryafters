/**
 * POST /api/register-interest
 *
 * Stores the visitor in Supabase, sends a confirmation email (when configured),
 * and mirrors them into the Resend Audience so we can broadcast later.
 *
 * Body: { name: string; email: string; fax_extension?: string }
 *  - `fax_extension` is a honeypot (NOT named "website" — browsers autofill that).
 */

import { getResendApi } from '../utils/resend'
import { registrationConfirmationContent } from '../utils/registration-confirmation-email'

interface RegisterBody {
  name?: unknown
  email?: unknown
  fax_extension?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)

  if (typeof body?.fax_extension === 'string' && body.fax_extension.trim().length > 0) {
    return { ok: true, alreadyRegistered: false }
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!name || name.length > 80) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter your name.' })
  }
  if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const supabase = useSupabaseAdmin()
  const { error: insertError } = await supabase
    .from('registrations')
    .insert({ name, email: rawEmail })

  let alreadyRegistered = false
  if (insertError) {
    if (insertError.code === '23505') {
      alreadyRegistered = true
    } else {
      console.error('[register-interest] Supabase insert failed', insertError)
      const hint
        = insertError.code === 'PGRST125'
          ? ' `NUXT_SUPABASE_URL` must be the project root only (e.g. `https://xxxx.supabase.co`), not a URL that already ends with `/rest/v1`.'
          : insertError.message?.includes('permission') || insertError.code === '42501'
            ? ' Check you are using a Supabase Secret key (`sb_secret_…`) or legacy service_role key, not the publishable/anon key.'
            : insertError.code === 'PGRST116' || insertError.message?.includes('relation')
              ? ' Check the `registrations` table exists (run the SQL from the project setup).'
              : ''
      throw createError({
        statusCode: 500,
        statusMessage: `Could not save your registration.${hint} Check the dev server terminal for details.`
      })
    }
  }

  const config = useRuntimeConfig()
  const mailer = getResendApi()
  const resendFrom = String(config.resendFrom ?? '').trim()

  if (!alreadyRegistered && mailer && resendFrom) {
    try {
      const displayName = name.split(/\s+/)[0] || name
      const { subject, html, text } = registrationConfirmationContent(displayName)
      const sent = await mailer.emails.send({
        from: resendFrom,
        to: rawEmail,
        subject,
        html,
        text
      })
      if (sent.error) {
        console.warn('[register-interest] confirmation email failed', sent.error)
      }
    } catch (err) {
      console.warn('[register-interest] confirmation email failed', err)
    }
  } else if (!alreadyRegistered && mailer && !resendFrom) {
    console.warn('[register-interest] Set NUXT_RESEND_FROM to send confirmation emails')
  }

  try {
    const audienceId = config.resendAudienceId
    if (mailer && audienceId) {
      const firstName = name.split(/\s+/)[0] ?? ''
      const lastName = name.split(/\s+/).slice(1).join(' ')
      await mailer.contacts.create({
        email: rawEmail,
        firstName,
        lastName,
        unsubscribed: false,
        audienceId
      })
    }
  } catch (err) {
    /*
     * Resend will reject duplicates / unverified domains here. We've already
     * stored the row in Supabase, so log and move on — don't fail the user.
     */
    console.warn('[register-interest] Resend contacts.create failed', err)
  }

  return { ok: true, alreadyRegistered }
})
