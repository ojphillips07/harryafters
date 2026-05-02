/**
 * POST /api/stripe/webhook
 *
 * Source of truth for ticket creation. Stripe Checkout calls this when a
 * payment completes; we verify the signature against the raw body, then:
 *   1. Insert a row in `public.tickets` (idempotent on stripe_session_id).
 *   2. Generate a QR PNG containing the ticket id.
 *   3. Email the ticket via Resend with the QR as an inline attachment.
 *
 * Configure the endpoint in Stripe (or `stripe listen --forward-to ...`) for
 * the `checkout.session.completed` event and put the printed `whsec_...` into
 * NUXT_STRIPE_WEBHOOK_SECRET.
 */

import type Stripe from 'stripe'
import { getResendApi } from '../../utils/resend'
import { renderQrPng } from '../../utils/qr-code'
import { getPublicSiteUrl, useStripe } from '../../utils/stripe'
import { ticketEmailContent } from '../../utils/ticket-email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = String(config.stripeWebhookSecret ?? '')
  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe webhook is not configured (missing NUXT_STRIPE_WEBHOOK_SECRET).'
    })
  }

  const sigHeader = getRequestHeader(event, 'stripe-signature')
  if (!sigHeader) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header.' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty webhook body.' })
  }

  const stripe = useStripe()
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err)
    throw createError({ statusCode: 400, statusMessage: 'Signature verification failed.' })
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { received: true, ignored: stripeEvent.type }
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session
  const sessionId = session.id

  const email = (
    session.customer_details?.email
    || session.customer_email
    || session.metadata?.attendee_email
    || ''
  ).trim().toLowerCase()
  const name = (
    session.customer_details?.name
    || session.metadata?.attendee_name
    || ''
  ).trim()
  const amountPence = session.amount_total ?? session.amount_subtotal ?? 0
  const currency = (session.currency ?? 'gbp').toLowerCase()
  const paymentIntent
    = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  if (!email || !name) {
    console.warn('[stripe/webhook] missing email or name on session', { sessionId, email, name })
    return { received: true, skipped: 'missing-email-or-name' }
  }

  const supabase = useSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('tickets')
    .select('id, email, name, used_at')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (existingError) {
    console.error('[stripe/webhook] tickets lookup failed', existingError)
    throw createError({ statusCode: 500, statusMessage: 'Ticket lookup failed.' })
  }

  let ticketId: string
  let isNew = false

  if (existing) {
    ticketId = existing.id as string
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('tickets')
      .insert({
        email,
        name,
        stripe_session_id: sessionId,
        stripe_payment_intent: paymentIntent,
        amount_pence: amountPence,
        currency,
        status: 'paid'
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[stripe/webhook] ticket insert failed', insertError)
      throw createError({ statusCode: 500, statusMessage: 'Could not create ticket row.' })
    }
    ticketId = inserted.id as string
    isNew = true
  }

  if (!isNew) {
    return { received: true, deduped: true, ticketId }
  }

  const mailer = getResendApi()
  const resendFrom = String(config.resendFrom ?? '').trim()

  if (!mailer || !resendFrom) {
    console.warn('[stripe/webhook] Resend not fully configured — ticket saved but email skipped')
    return { received: true, ticketId, emailed: false }
  }

  try {
    const qrPng = await renderQrPng(ticketId)
    const ticketUrl = `${getPublicSiteUrl()}/tickets/${ticketId}`
    const { subject, html, text } = ticketEmailContent({
      name,
      ticketId,
      amountPence,
      currency,
      ticketUrl
    })

    const sent = await mailer.emails.send({
      from: resendFrom,
      to: email,
      subject,
      html,
      text,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrPng,
          contentId: 'ticket-qr'
        }
      ]
    })

    if (sent.error) {
      console.warn('[stripe/webhook] ticket email failed', sent.error)
      return { received: true, ticketId, emailed: false, error: sent.error.message }
    }
    return { received: true, ticketId, emailed: true }
  } catch (err) {
    console.warn('[stripe/webhook] ticket email failed', err)
    return { received: true, ticketId, emailed: false }
  }
})
