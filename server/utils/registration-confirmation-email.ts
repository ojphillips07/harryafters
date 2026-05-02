/** Confirmation sent after a new interest signup (not on duplicate-email retries). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Mirrors app/assets/css/main.css @theme — gray-950 canvas, primary pink, accent blue */
const C = {
  bg: '#030712',
  surface2: '#0f172a',
  border: '#1f2937',
  borderPink: 'rgba(236,72,153,0.28)',
  primary300: '#f9a8d4',
  primary400: '#f472b6',
  primary500: '#ec4899',
  accent500: '#3b82f6',
  text: '#f3f4f6',
  muted: '#9ca3af',
  faint: '#6b7280'
} as const

export function registrationConfirmationContent(displayName: string): {
  subject: string
  text: string
  html: string
} {
  const rawName = displayName.trim() || 'there'
  const safe = escapeHtml(rawName)
  const subject = 'You’re on the list — Harry Afters'

  const text = `Hi ${rawName},

You’re on the list for Harry Afters — Fairfax Year 13 prom after party at Harry’s.

We’ve saved your details. When tickets go live, this is how we’ll reach you — don’t miss it.

— Harry Afters`

  const fontSans = '\'Public Sans\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif'
  const fontDisplay = '\'Bebas Neue\',\'Arial Narrow\',Impact,sans-serif'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">
    table, td { border-collapse: collapse; }
    body, table, td, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.bg};color:${C.text};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    You’re registered for Harry Afters — we’ll email you when tickets go on sale.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.bg};background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(236,72,153,0.12),transparent),radial-gradient(ellipse 70% 45% at 100% 100%,rgba(59,130,246,0.1),transparent);">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 4px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:20px;overflow:hidden;border:1px solid ${C.border};background:${C.surface2};box-shadow:0 0 0 1px rgba(255,255,255,0.04),0 24px 48px rgba(0,0,0,0.45),0 0 40px rgba(59,130,246,0.12),0 0 60px rgba(236,72,153,0.06);">
                <tr>
                  <td style="height:3px;line-height:3px;background:linear-gradient(90deg,${C.primary500},${C.accent500});font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 14px;border-radius:999px;border:1px solid ${C.borderPink};background:rgba(236,72,153,0.1);">
                          <span style="font-family:${fontSans};font-size:13px;font-weight:600;color:${C.primary300};letter-spacing:0.02em;">
                            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${C.primary400};margin-right:8px;vertical-align:middle;"></span>
                            Interest registered
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 8px;">
                    <h1 style="margin:0;font-family:${fontDisplay};font-size:42px;font-weight:400;line-height:1.05;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};text-shadow:0 0 24px rgba(236,72,153,0.35);">
                      You’re on the list
                    </h1>
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
                  <td style="padding:0 28px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:16px;border:1px solid rgba(236,72,153,0.15);background:rgba(17,24,39,0.85);">
                      <tr>
                        <td style="padding:22px 22px 20px;font-family:${fontSans};font-size:16px;line-height:1.65;color:${C.text};">
                          Hi <strong style="color:${C.primary400};font-weight:700;">${safe}</strong>,
                          <p style="margin:14px 0 0;font-weight:400;color:${C.muted};">
                            Thanks for registering — we’ve saved your email so we can reach you <span style="color:${C.text};">when tickets go on sale</span>. This list is how we’ll know you’re in for <span style="color:${C.text};font-weight:600;">Harry Afters</span>; skip the noise elsewhere.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 28px;font-family:${fontSans};font-size:13px;line-height:1.5;color:${C.faint};border-top:1px solid ${C.border};">
                    <p style="margin:20px 0 0;">
                      — <span style="color:${C.muted};font-weight:600;">Harry Afters</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
}
