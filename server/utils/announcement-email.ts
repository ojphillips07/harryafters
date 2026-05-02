/** "Tickets are live" announcement broadcast to the registrations audience. */

import { C, escapeHtml, fontSans, headline, pillBadge, primaryButton, renderEmailShell } from './email-theme'

interface AnnouncementInput {
  /** URL the big CTA button points to. */
  buyUrl: string
  /** e.g. "£6" — display only. */
  priceLabel?: string
}

export function announcementEmailContent(input: AnnouncementInput): {
  subject: string
  text: string
  html: string
} {
  const buyUrlAttr = escapeHtml(input.buyUrl)
  const priceLabel = (input.priceLabel ?? '').trim()
  const safePrice = priceLabel ? escapeHtml(priceLabel) : ''

  const subject = 'Tickets are live — Harry Afters'

  const text = `Tickets are live for Harry Afters.

Year 13 prom after party at Harry's. ${priceLabel ? `Tickets ${priceLabel}.` : ''} Lights, music, drinks. BYOB.

Grab yours: ${input.buyUrl}

Numbers are limited. We'll close sales when we hit capacity, so don't sleep on it.

— Harry Afters`

  const innerHtml = `
    <tr>
      <td style="padding:28px 28px 8px;">
        ${pillBadge('Tickets live', {
          dotColor: C.accent500,
          borderColor: 'rgba(59,130,246,0.32)',
          bgColor: 'rgba(59,130,246,0.1)',
          textColor: '#93c5fd'
        })}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 8px;">
        ${headline('Tickets are live')}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 28px 20px;">
        <p style="margin:0;font-family:${fontSans};font-size:15px;line-height:1.55;color:${C.muted};">
          <strong style="color:${C.text};font-weight:700;">Harry Afters</strong> — Year 13 prom after party at Harry’s.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:16px;border:1px solid ${C.borderPinkSoft};background:${C.panel};">
          <tr>
            <td style="padding:22px 22px 18px;font-family:${fontSans};font-size:16px;line-height:1.6;color:${C.text};">
              You signed up. Tickets just dropped.
              <p style="margin:14px 0 0;font-weight:400;color:${C.muted};">
                One night at <span style="color:${C.text};">Harry’s</span> — lights, music, BYOB${priceLabel ? `. Tickets <span style="color:${C.text};font-weight:600;">${safePrice}</span>` : ''}. Card / Apple Pay / Google Pay at checkout.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 22px 26px;">
              ${primaryButton('Grab a ticket', input.buyUrl)}
              <p style="margin:14px 0 0;font-family:${fontSans};font-size:12px;line-height:1.5;color:${C.faint};">
                Or paste this link in your browser:<br>
                <a href="${buyUrlAttr}" style="color:${C.primary300};text-decoration:underline;word-break:break-all;">${buyUrlAttr}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <p style="margin:0;font-family:${fontSans};font-size:13px;line-height:1.6;color:${C.muted};">
          Numbers are capped — once we hit capacity, sales close. Best to sort it tonight.
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
    preheader: priceLabel
      ? `Year 13 prom after party at Harry’s. Tickets ${priceLabel}. Grab yours.`
      : 'Year 13 prom after party at Harry’s. Tickets are live — grab yours.'
  })

  return { subject, text, html }
}
