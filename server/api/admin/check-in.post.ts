/**
 * POST /api/admin/check-in
 *
 * Door-scan endpoint. The /admin/door page POSTs the scanned QR payload here
 * with the admin token in the `x-admin-token` header.
 *
 * Body: { ticketId: string }
 * Returns:
 *   { status: 'ok',           ticket: { id, name, usedAt } }
 *   { status: 'already_used', ticket: { id, name, usedAt } }
 *   { status: 'not_found' }
 */

interface CheckInBody {
  ticketId?: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  const body = await readBody<CheckInBody>(event)
  const raw = typeof body?.ticketId === 'string' ? body.ticketId.trim() : ''
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ticketId.' })
  }
  if (!UUID_RE.test(raw)) {
    return { status: 'not_found' as const }
  }

  const supabase = useSupabaseAdmin()

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('id, name, status, used_at')
    .eq('id', raw)
    .maybeSingle()

  if (lookupError) {
    console.error('[admin/check-in] lookup failed', lookupError)
    throw createError({ statusCode: 500, statusMessage: 'Ticket lookup failed.' })
  }

  if (!ticket) {
    return { status: 'not_found' as const }
  }

  if (ticket.status === 'refunded') {
    return {
      status: 'refunded' as const,
      ticket: { id: ticket.id, name: ticket.name, usedAt: ticket.used_at }
    }
  }

  if (ticket.used_at) {
    return {
      status: 'already_used' as const,
      ticket: { id: ticket.id, name: ticket.name, usedAt: ticket.used_at }
    }
  }

  const usedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ used_at: usedAt })
    .eq('id', raw)
    .is('used_at', null)

  if (updateError) {
    console.error('[admin/check-in] update failed', updateError)
    throw createError({ statusCode: 500, statusMessage: 'Could not mark ticket as used.' })
  }

  return {
    status: 'ok' as const,
    ticket: { id: ticket.id, name: ticket.name, usedAt }
  }
})
