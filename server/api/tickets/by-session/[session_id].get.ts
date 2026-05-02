/**
 * GET /api/tickets/by-session/:session_id
 *
 * Used on /buy/success after Stripe redirects with ?session_id=cs_...
 * Verifies the Checkout Session is paid, then returns the ticket row once
 * the webhook has created it (or { pending: true } while waiting).
 */

import { useStripe } from '../../../utils/stripe'

const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]+$/

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'session_id') ?? ''
  if (!SESSION_ID_RE.test(sessionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid checkout session.' })
  }

  const stripe = useStripe()
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Checkout session not found.' })
  }

  if (session.payment_status !== 'paid') {
    throw createError({ statusCode: 404, statusMessage: 'Payment not completed.' })
  }

  const customerEmail = (
    session.customer_details?.email
    || session.customer_email
    || (typeof session.metadata?.attendee_email === 'string' ? session.metadata.attendee_email : '')
    || ''
  )
    .trim()
    .toLowerCase()

  const supabase = useSupabaseAdmin()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, name, email, status, used_at, created_at, amount_pence, currency')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (error) {
    console.error('[tickets/by-session] lookup failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Ticket lookup failed.' })
  }

  if (!ticket) {
    return {
      pending: true as const,
      customerEmail: customerEmail || null
    }
  }

  return {
    pending: false as const,
    ticket: {
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      status: ticket.status,
      usedAt: ticket.used_at,
      createdAt: ticket.created_at,
      amountPence: ticket.amount_pence,
      currency: ticket.currency
    }
  }
})
