import Stripe from 'stripe'

let cached: { client: Stripe, key: string } | null = null

/** Server-side Stripe client. Reuses the SDK's pinned API version. */
export function useStripe(): Stripe {
  const config = useRuntimeConfig()
  const key = String(config.stripeSecretKey ?? '')

  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe is not configured (missing NUXT_STRIPE_SECRET_KEY).'
    })
  }

  if (cached?.key === key) {
    return cached.client
  }

  const client = new Stripe(key, {
    typescript: true,
    appInfo: { name: 'HarryAfters' }
  })
  cached = { client, key }
  return client
}

/** Entry ticket only (excludes booking fee). `NUXT_TICKET_PRICE_PENCE`, e.g. 600 = £6.00. */
export function getTicketPricePence(): number {
  const config = useRuntimeConfig()
  const n = Number(String(config.ticketPricePence ?? '').trim())
  if (!Number.isFinite(n) || n <= 0) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'NUXT_TICKET_PRICE_PENCE is missing or invalid (must be a positive integer in pence — the entry ticket subtotal, not including the booking fee).'
    })
  }
  return Math.round(n)
}

/** Card-processing booking fee line item in Stripe Checkout (default 30p). */
export function getBookingFeePence(): number {
  const config = useRuntimeConfig()
  const n = Math.round(Number(String(config.bookingFeePence ?? '30').trim()))
  if (!Number.isFinite(n) || n < 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_BOOKING_FEE_PENCE is invalid (must be a non-negative integer in pence).'
    })
  }
  return n
}

/**
 * Entry ticket + booking fee line items. Total charged =
 * `NUXT_TICKET_PRICE_PENCE` + `NUXT_BOOKING_FEE_PENCE` (e.g. 600 + 30 = £6.30).
 */
export function getCheckoutLineAmounts(): {
  entryPence: number
  bookingPence: number
  totalPence: number
} {
  const entryPence = getTicketPricePence()
  const bookingPence = getBookingFeePence()
  const totalPence = entryPence + bookingPence
  return { entryPence, bookingPence, totalPence }
}

export function getPublicSiteUrl(): string {
  const config = useRuntimeConfig()
  let raw = String(config.public?.siteUrl ?? '').trim()
  if (!raw && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    raw = `https://${host}`
  }
  if (!raw) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'NUXT_PUBLIC_SITE_URL is not configured. Set it in Vercel → Environment Variables (or deploy on Vercel where VERCEL_URL is set).'
    })
  }
  return raw.replace(/\/+$/, '')
}
