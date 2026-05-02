/**
 * GET /api/tickets/:id
 *
 * Public, read-only ticket lookup so a buyer who lost the email can re-open
 * their ticket. Knowing the ticket UUID is treated as proof of ownership.
 * We never expose the email or Stripe IDs.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found.' })
  }

  const supabase = useSupabaseAdmin()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, name, status, used_at, created_at, amount_pence, currency')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[tickets/:id] lookup failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Ticket lookup failed.' })
  }
  if (!ticket) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found.' })
  }

  return {
    id: ticket.id,
    name: ticket.name,
    status: ticket.status,
    usedAt: ticket.used_at,
    createdAt: ticket.created_at,
    amountPence: ticket.amount_pence,
    currency: ticket.currency
  }
})
