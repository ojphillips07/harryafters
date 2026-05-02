/**
 * Shared visual tokens + tiny HTML helpers for transactional/marketing emails.
 * Mirrors `app/assets/css/main.css` @theme so every email matches the site.
 */

export const C = {
  bg: '#030712',
  surface2: '#0f172a',
  panel: 'rgba(17,24,39,0.85)',
  border: '#1f2937',
  borderPink: 'rgba(236,72,153,0.28)',
  borderPinkSoft: 'rgba(236,72,153,0.15)',
  primary300: '#f9a8d4',
  primary400: '#f472b6',
  primary500: '#ec4899',
  primary600: '#db2777',
  accent500: '#3b82f6',
  text: '#f3f4f6',
  muted: '#9ca3af',
  faint: '#6b7280'
} as const

export const fontSans
  = '\'Public Sans\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif'
export const fontDisplay = '\'Bebas Neue\',\'Arial Narrow\',Impact,sans-serif'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface EmailShellOptions {
  /** Pre-rendered HTML for the inside of the card (everything below the gradient stripe). */
  innerHtml: string
  /** Hidden preview text shown by inbox previews. */
  preheader: string
}

/**
 * Wraps inner HTML in the standard "Harry Afters card" — gray-950 canvas,
 * pink↔blue glow washes, gradient top stripe, dark inner panel.
 */
export function renderEmailShell(opts: EmailShellOptions): string {
  return `<!DOCTYPE html>
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
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(opts.preheader)}</div>
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
                ${opts.innerHtml}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Standard pill badge. Pass dotColor/border/bg if you want a non-pink variant
 * (e.g. blue for "TICKETS LIVE").
 */
export function pillBadge(label: string, opts?: {
  dotColor?: string
  borderColor?: string
  bgColor?: string
  textColor?: string
}): string {
  const dot = opts?.dotColor ?? C.primary400
  const border = opts?.borderColor ?? C.borderPink
  const bg = opts?.bgColor ?? 'rgba(236,72,153,0.1)'
  const text = opts?.textColor ?? C.primary300
  return `<table role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:6px 14px;border-radius:999px;border:1px solid ${border};background:${bg};">
        <span style="font-family:${fontSans};font-size:13px;font-weight:600;color:${text};letter-spacing:0.02em;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dot};margin-right:8px;vertical-align:middle;"></span>${escapeHtml(label)}
        </span>
      </td>
    </tr>
  </table>`
}

/** Big Bebas Neue headline with subtle pink glow (matches `.glow-text`). */
export function headline(text: string): string {
  return `<h1 style="margin:0;font-family:${fontDisplay};font-size:42px;font-weight:400;line-height:1.05;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};text-shadow:0 0 24px rgba(236,72,153,0.35);">${escapeHtml(text)}</h1>`
}

/** Pink filled CTA button (bulletproof-enough for Gmail/Outlook). */
export function primaryButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:16px;background:linear-gradient(135deg,${C.primary500},${C.primary600});box-shadow:0 12px 30px rgba(236,72,153,0.35),0 0 0 1px rgba(236,72,153,0.4) inset;">
        <a href="${href}" style="display:inline-block;padding:16px 32px;font-family:${fontSans};font-size:16px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`
}
