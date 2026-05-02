/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for a single Harry Afters ticket and
 * returns a redirect URL. The webhook (`/api/stripe/webhook`) is the source of
 * truth — it issues the actual ticket once payment is confirmed.
 *
 * Payment methods (card, Apple Pay, Google Pay, etc.) follow your Stripe
 * Dashboard settings — we do not hard-code `payment_method_types` so wallets
 * can appear when enabled. Production Apple Pay needs domain verification in
 * Stripe (Settings → Payment methods → Apple Pay).
 *
 * Body: { name, email, fax_extension }
 *  - `fax_extension` is the same honeypot used in /api/register-interest.
 */

import { getCheckoutLineAmounts, getPublicSiteUrl, useStripe } from '../utils/stripe'

interface CheckoutBody {
  name?: unknown
  email?: unknown
  fax_extension?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<CheckoutBody>(event)

  if (typeof body?.fax_extension === 'string' && body.fax_extension.trim().length > 0) {
    return { ok: true, url: `${getPublicSiteUrl()}/buy/success` }
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!name || name.length > 80) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter your name.' })
  }
  if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const stripe = useStripe()
  const baseUrl = getPublicSiteUrl()
  const { entryPence, bookingPence, totalPence } = getCheckoutLineAmounts()

  const fmt = (pence: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(pence / 100)

  const assetUrl = `${baseUrl}/favicon.png`
  const brandingLogoIcon = baseUrl.startsWith('https://')
    ? {
        icon: { type: 'url' as const, url: assetUrl },
        logo: { type: 'url' as const, url: assetUrl }
      }
    : {}

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      customer_email: rawEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: entryPence,
            product_data: {
              name: 'Entry ticket',
              description:
                `Harry Afters — Year 13 prom after party. ${fmt(entryPence)} toward your ${fmt(totalPence)} total (booking fee is the next line). One person, one ticket.`
            }
          }
        },
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: bookingPence,
            product_data: {
              name: 'Booking & card fee (separate charge)',
              description:
                `Non-refundable ${fmt(bookingPence)} — shown separately from entry so it’s clear. Your full payment today is ${fmt(totalPence)} (${fmt(entryPence)} + ${fmt(bookingPence)}).`
            }
          }
        }
      ],
      branding_settings: {
        background_color: '#030712',
        button_color: '#ec4899',
        border_style: 'rounded',
        display_name: 'Harry Afters',
        font_family: 'montserrat',
        ...brandingLogoIcon
      },
      custom_text: {
        submit: {
          message:
            `You pay ${fmt(totalPence)} once — that’s ${fmt(entryPence)} entry plus ${fmt(bookingPence)} booking fee as two lines above. BYOB on the night — see site for details.`
        }
      },
      metadata: {
        attendee_name: name,
        attendee_email: rawEmail
      },
      success_url: `${baseUrl}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buy/cancel`
    })

    if (!session.url) {
      throw createError({ statusCode: 502, statusMessage: 'Stripe did not return a checkout URL.' })
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error('[checkout] Stripe session create failed', err)
    const msg = err instanceof Error ? err.message : 'Unable to start checkout.'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
