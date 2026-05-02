import QRCode from 'qrcode'

/**
 * Renders the given payload (typically the ticket UUID) as a PNG Buffer.
 * `errorCorrectionLevel: 'M'` keeps the QR readable on a phone screen even with
 * minor smudges / glare; `scale: 8` gives ~256–296px output.
 */
export async function renderQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })
}
