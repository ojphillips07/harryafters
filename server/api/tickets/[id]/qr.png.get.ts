/**
 * GET /api/tickets/:id/qr.png
 *
 * Public: renders a ticket QR as a PNG so users can save it to camera roll.
 * Knowing the ticket UUID is treated as proof of ownership.
 */

import { renderQrPng } from '../../../utils/qr-code'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found.' })
  }

  const supabase = useSupabaseAdmin()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[tickets/:id/qr.png] lookup failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Ticket lookup failed.' })
  }
  if (!ticket) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found.' })
  }

  const png = await renderQrPng(id)
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'content-disposition', 'inline; filename="harry-afters-ticket-qr.png"')
  setHeader(event, 'cache-control', 'private, max-age=3600')
  return png
})

