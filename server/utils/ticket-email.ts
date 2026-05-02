/** "Your ticket" email sent after a successful Stripe Checkout. */

import { C, escapeHtml, fontSans, headline, pillBadge, renderEmailShell } from './email-theme'

interface TicketEmailInput {
  name: string
  ticketId: string
  amountPence: number
  currency: string
  /** Public URL where the user can re-open their ticket if they lose the email. */
  ticketUrl: string
}

function formatPrice(pence: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(pence / 100)
  } catch {
    return `${(pence / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

export function ticketEmailContent(input: TicketEmailInput): {
  subject: string
  text: string
  html: string
} {
  const safeName = escapeHtml(input.name.trim() || 'there')
  const safeTicketId = escapeHtml(input.ticketId)
  const safeUrl = escapeHtml(input.ticketUrl)
  const price = formatPrice(input.amountPence, input.currency)

  const subject = 'Your Harry Afters ticket'

  const text = `Hi ${input.name.trim() || 'there'},

You're in. This email is your ticket to Harry Afters.
25 June. Starts 10pm.

Show the QR code at the door. Door staff will scan it once.

Ticket ID: ${input.ticketId}
Paid: ${price}

Lost this email? Open: ${input.ticketUrl}
Save QR: ${input.ticketUrl} (tap “Save QR to camera roll”)

— Harry Afters`

  const innerHtml = `
    <tr>
      <td style="padding:28px 28px 8px;">
        ${pillBadge('Ticket confirmed')}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 8px;">
        ${headline('Entry ticket')}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 28px 20px;">
        <p style="margin:0;font-family:${fontSans};font-size:15px;line-height:1.55;color:${C.muted};">
          <strong style="color:${C.text};font-weight:700;">Harry Afters</strong> — Year 13 prom after party at Harry’s.
          <span style="display:block;margin-top:6px;color:${C.text};font-weight:700;">25 June · Starts 10pm.</span>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:16px;border:1px solid ${C.borderPinkSoft};background:${C.panel};">
          <tr>
            <td style="padding:22px 22px 8px;font-family:${fontSans};font-size:15px;line-height:1.55;color:${C.text};">
              Hi <strong style="color:${C.primary400};font-weight:700;">${safeName}</strong>, you’re in.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 22px 16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#ffffff;padding:14px;">
                <tr>
                  <td>
                    <img src="cid:ticket-qr" alt="Entry QR code" width="240" height="240" style="display:block;width:240px;height:240px;border:0;outline:none;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 22px 18px;">
              <p style="margin:0;font-family:${fontSans};font-size:13px;line-height:1.45;color:${C.muted};letter-spacing:0.02em;">
                Show this at the door. One scan only.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 22px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${C.border};">
                <tr>
                  <td style="padding:14px 0 0;font-family:${fontSans};font-size:12px;line-height:1.5;color:${C.faint};">
                    <div style="text-transform:uppercase;letter-spacing:0.08em;color:${C.muted};font-weight:700;">Ticket ID</div>
                    <div style="margin-top:2px;font-family:'Courier New',monospace;font-size:13px;color:${C.text};word-break:break-all;">${safeTicketId}</div>
                  </td>
                  <td align="right" style="padding:14px 0 0;font-family:${fontSans};font-size:12px;line-height:1.5;color:${C.faint};">
                    <div style="text-transform:uppercase;letter-spacing:0.08em;color:${C.muted};font-weight:700;">Paid</div>
                    <div style="margin-top:2px;font-size:14px;color:${C.text};font-weight:700;">${escapeHtml(price)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <p style="margin:0;font-family:${fontSans};font-size:13px;line-height:1.6;color:${C.muted};">
          Save this email. If you lose it, you can re-open your ticket here:
          <a href="${safeUrl}" style="color:${C.primary300};text-decoration:underline;">${safeUrl}</a>
        </p>
        <p style="margin:10px 0 0;font-family:${fontSans};font-size:13px;line-height:1.6;color:${C.muted};">
          Want it in your camera roll? Open that link and tap <strong style="color:${C.text};font-weight:700;">Save QR to camera roll</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;font-family:${fontSans};font-size:13px;line-height:1.5;color:${C.faint};border-top:1px solid ${C.border};">
        <p style="margin:20px 0 0;">
          — <span style="color:${C.muted};font-weight:600;">Harry Afters</span>
        </p>
      </td>
    </tr>`

  const html = renderEmailShell({
    innerHtml,
    preheader: 'Your Harry Afters ticket — show the QR at the door.'
  })

  return { subject, text, html }
}
