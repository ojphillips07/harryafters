import { Resend } from 'resend'

let cachedClient: Resend | null = null
let cachedApiKey: string | null = null

/** Singleton Resend client — only needs `NUXT_RESEND_API_KEY`. */
export function getResendApi(): Resend | null {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey
  if (!apiKey) return null
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient
  }
  cachedClient = new Resend(apiKey)
  cachedApiKey = apiKey
  return cachedClient
}

interface ResendClient {
  client: Resend
  audienceId: string
}

/** Resend + audience for list sync (requires API key and audience id). */
export function useResend(): ResendClient {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey
  const audienceId = config.resendAudienceId

  if (!apiKey || !audienceId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Resend is not configured (missing NUXT_RESEND_API_KEY or NUXT_RESEND_AUDIENCE_ID).'
    })
  }

  const client = getResendApi()
  if (!client) {
    throw createError({ statusCode: 500, statusMessage: 'Resend client could not be created.' })
  }
  return { client, audienceId }
}
