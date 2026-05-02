/**
 * GET /api/ticket-pricing
 *
 * Public: total checkout amount, booking fee, and entry subtotal (all in pence).
 * Keeps /buy copy in sync with what Stripe Checkout charges.
 */

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const entryPence = Math.round(Number(String(config.ticketPricePence ?? '').trim()))
  const bookingPence = Math.round(Number(String(config.bookingFeePence ?? '30').trim()))

  const validEntry = Number.isFinite(entryPence) && entryPence >= 1
  const validBooking = Number.isFinite(bookingPence) && bookingPence >= 0
  const totalPence = validEntry && validBooking ? entryPence + bookingPence : NaN
  const ok = validEntry && validBooking && Number.isFinite(totalPence)

  return {
    totalPence: ok ? totalPence : null,
    bookingPence: ok ? bookingPence : null,
    entryPence: ok ? entryPence : null,
    labels: ok
      ? {
          total: formatGbp(totalPence),
          booking: formatGbp(bookingPence),
          entry: formatGbp(entryPence)
        }
      : null
  }
})

function formatGbp(pence: number): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(pence / 100)
  } catch {
    return `£${(pence / 100).toFixed(2)}`
  }
}
