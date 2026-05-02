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

/** Default checkout total in pence when env omits both total and entry (£6.30). */
const DEFAULT_CHECKOUT_TOTAL_PENCE = 630

/**
 * Entry ticket + booking fee line items.
 *
 * Prefer `NUXT_CHECKOUT_TOTAL_PENCE` (e.g. 630 = £6.30 all-in); entry is computed as total − fee.
 * Legacy: `NUXT_TICKET_PRICE_PENCE` (entry only, e.g. 600) + fee — never put 630 in the entry field
 * (that is the full total in pence and adds the fee twice → £6.60).
 */
export function getCheckoutLineAmounts(): {
  entryPence: number
  bookingPence: number
  totalPence: number
} {
  const config = useRuntimeConfig()
  const bookingPence = getBookingFeePence()

  const totalRaw = String(config.checkoutTotalPence ?? '').trim()
  const ticketRaw = String(config.ticketPricePence ?? '').trim()

  const totalParsed = totalRaw !== '' ? Math.round(Number(totalRaw)) : NaN
  const ticketParsed = ticketRaw !== '' ? Math.round(Number(ticketRaw)) : NaN

  let totalPence: number
  let entryPence: number

  if (Number.isFinite(totalParsed) && totalParsed >= 1) {
    totalPence = totalParsed
    entryPence = totalPence - bookingPence
    if (entryPence < 1) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'NUXT_CHECKOUT_TOTAL_PENCE must be larger than NUXT_BOOKING_FEE_PENCE (e.g. 630 total with 30p fee → £6.00 entry).'
      })
    }
  } else if (Number.isFinite(ticketParsed) && ticketParsed >= 1) {
    if (ticketParsed === 630 && bookingPence === 30) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'NUXT_TICKET_PRICE_PENCE is 630 — that number is the full £6.30 total in pence, not the entry line. Use NUXT_CHECKOUT_TOTAL_PENCE=630 (recommended) or NUXT_TICKET_PRICE_PENCE=600 so the total stays £6.30, not £6.60.'
      })
    }
    entryPence = ticketParsed
    totalPence = entryPence + bookingPence
  } else {
    totalPence = DEFAULT_CHECKOUT_TOTAL_PENCE
    entryPence = totalPence - bookingPence
    if (entryPence < 1) {
      throw createError({
        statusCode: 500,
        statusMessage: 'NUXT_BOOKING_FEE_PENCE is too high for the default £6.30 checkout total.'
      })
    }
  }

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
