/**
 * GET /api/ticket-pricing
 *
 * Public: total checkout amount, booking fee, and entry subtotal (all in pence).
 * Keeps /buy copy in sync with what Stripe Checkout charges.
 */

import { getCheckoutLineAmounts } from '../utils/stripe'

export default defineEventHandler(() => {
  try {
    const { entryPence, bookingPence, totalPence } = getCheckoutLineAmounts()
    return {
      totalPence,
      bookingPence,
      entryPence,
      labels: {
        total: formatGbp(totalPence),
        booking: formatGbp(bookingPence),
        entry: formatGbp(entryPence)
      }
    }
  } catch {
    return {
      totalPence: null,
      bookingPence: null,
      entryPence: null,
      labels: null
    }
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
