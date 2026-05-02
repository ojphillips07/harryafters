/**
 * GET /api/debug/register-env
 *
 * Dev-only: shows whether Nuxt loaded your `NUXT_*` vars (booleans only, no secrets).
 * Also checks **shape** of values (URL host, key type) so you can spot wrong clipboard.
 * Supabase supports **new** `sb_secret_…` keys and **legacy** JWT `service_role` keys — both are valid for `NUXT_SUPABASE_SERVICE_KEY`.
 * Visit this when the form “does nothing” — usually means `.env` wasn’t picked up.
 */

function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { role?: string }
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

export default defineEventHandler(() => {
  if (import.meta.prod) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const config = useRuntimeConfig()
  const url = String(config.supabaseUrl ?? '')
  const key = String(config.supabaseServiceKey ?? '')
  const resendKey = String(config.resendApiKey ?? '')
  const stripeKey = String(config.stripeSecretKey ?? '').trim()
  const stripeWh = String(config.stripeWebhookSecret ?? '').trim()
  const ticketPrice = Number(String(config.ticketPricePence ?? '').trim())
  const bookingFee = Number(String(config.bookingFeePence ?? '30').trim())
  const siteUrl = String(config.public?.siteUrl ?? '').trim()

  const supabaseUrlLooksLikeProject = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url.trim())

  const jwtRole = key ? decodeJwtRole(key) : null
  const k = key.trim()
  let supabaseServiceKeyKind:
    | 'new_secret'
    | 'legacy_jwt'
    | 'publishable_wrong_slot'
    | 'empty'
    | 'unrecognized' = 'empty'

  if (!k) supabaseServiceKeyKind = 'empty'
  else if (k.startsWith('sb_secret_')) supabaseServiceKeyKind = 'new_secret'
  else if (k.startsWith('sb_publishable_')) supabaseServiceKeyKind = 'publishable_wrong_slot'
  else if (jwtRole !== null) supabaseServiceKeyKind = 'legacy_jwt'
  else supabaseServiceKeyKind = 'unrecognized'

  const supabaseServiceKeyShapeOk
    = supabaseServiceKeyKind === 'new_secret'
      || (supabaseServiceKeyKind === 'legacy_jwt' && jwtRole === 'service_role')

  return {
    hint:
      'All `has*` should be true. Stripe keys: `sk_test_…` for dev, `whsec_…` for the webhook. Use Supabase Secret key (`sb_secret_…`) or legacy JWT `service_role` — not `anon` / not `sb_publishable_`. Then GET `/api/debug/register-test`.',
    hasSupabaseUrl: Boolean(config.supabaseUrl),
    hasSupabaseServiceKey: Boolean(config.supabaseServiceKey),
    hasResendApiKey: Boolean(config.resendApiKey),
    hasResendAudienceId: Boolean(config.resendAudienceId),
    hasResendFrom: Boolean(String(config.resendFrom ?? '').trim()),
    hasAdminToken: Boolean(config.adminToken),
    hasStripeSecretKey: Boolean(stripeKey),
    hasStripeWebhookSecret: Boolean(stripeWh),
    hasTicketPricePence: Number.isFinite(ticketPrice) && ticketPrice > 0,
    hasBookingFeePence: Number.isFinite(bookingFee) && bookingFee >= 0,
    /** Entry ticket + booking fee; both env vars must be valid */
    checkoutSplitOk:
      Number.isFinite(ticketPrice)
      && ticketPrice >= 1
      && Number.isFinite(bookingFee)
      && bookingFee >= 0,
    /** Total charged at Stripe if env is valid (ticket + booking), e.g. 630 = £6.30 */
    checkoutTotalPence:
      Number.isFinite(ticketPrice)
      && ticketPrice >= 1
      && Number.isFinite(bookingFee)
      && bookingFee >= 0
        ? ticketPrice + bookingFee
        : null,
    hasPublicSiteUrl: Boolean(siteUrl),
    supabaseUrlLooksLikeProject,
    supabaseServiceKeyKind,
    supabaseServiceKeyShapeOk,
    supabaseJwtRole: jwtRole,
    supabaseKeyLooksLikeJwt: jwtRole !== null,
    resendApiKeyLooksLikeResend: resendKey.startsWith('re_'),
    stripeSecretKeyLooksOk: /^sk_(test|live)_/.test(stripeKey),
    stripeWebhookSecretLooksOk: stripeWh.startsWith('whsec_'),
    ticketPricePence: Number.isFinite(ticketPrice) ? ticketPrice : null,
    bookingFeePence: Number.isFinite(bookingFee) ? bookingFee : null,
    publicSiteUrlLooksOk: /^https?:\/\//i.test(siteUrl)
  }
})
