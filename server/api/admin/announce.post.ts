/**
 * POST /api/admin/announce
 *
 * Fires the "tickets are live" broadcast through Resend to the audience that
 * `register-interest` has been populating. Token-gated with `x-admin-token`.
 *
 * Body (all optional):
 *   { subject?: string; priceLabel?: string; dryRun?: boolean }
 *
 * `dryRun: true` returns the rendered preview (subject + html + text) without
 * creating or sending the broadcast in Resend.
 */

import { announcementEmailContent } from '../../utils/announcement-email'
import { useResend } from '../../utils/resend'
import { getPublicSiteUrl } from '../../utils/stripe'

interface AnnounceBody {
  subject?: unknown
  priceLabel?: unknown
  dryRun?: unknown
  /** Optional ISO 8601 / "in 1 hour" string passed through to Resend. */
  scheduledAt?: unknown
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminToken = String(config.adminToken ?? '')
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ADMIN_TOKEN is not configured.' })
  }

  const supplied = getRequestHeader(event, 'x-admin-token')
  if (supplied !== adminToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized.' })
  }

  const body = (await readBody<AnnounceBody>(event)) ?? {}
  const dryRun = body.dryRun === true
  const priceLabel = typeof body.priceLabel === 'string' ? body.priceLabel.trim() : ''
  const subjectOverride = typeof body.subject === 'string' ? body.subject.trim() : ''
  const scheduledAt = typeof body.scheduledAt === 'string' ? body.scheduledAt.trim() : ''

  const buyUrl = `${getPublicSiteUrl()}/buy`
  const rendered = announcementEmailContent({
    buyUrl,
    priceLabel: priceLabel || undefined
  })
  const subject = subjectOverride || rendered.subject

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      subject,
      buyUrl,
      html: rendered.html,
      text: rendered.text
    }
  }

  const { client, audienceId } = useResend()
  const resendFrom = String(config.resendFrom ?? '').trim()
  if (!resendFrom) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_RESEND_FROM is required to send the announcement broadcast.'
    })
  }

  try {
    const created = await client.broadcasts.create({
      audienceId,
      from: resendFrom,
      subject,
      html: rendered.html,
      text: rendered.text,
      ...(scheduledAt
        ? { send: true as const, scheduledAt }
        : { send: true as const })
    })

    if (created.error || !created.data) {
      console.error('[admin/announce] broadcasts.create failed', created.error)
      throw createError({
        statusCode: 502,
        statusMessage: created.error?.message ?? 'Failed to create broadcast.'
      })
    }

    return {
      ok: true,
      broadcastId: created.data.id,
      subject,
      buyUrl,
      scheduledAt: scheduledAt || null
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.error('[admin/announce] unexpected failure', err)
    const msg = err instanceof Error ? err.message : 'Failed to send announcement.'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
