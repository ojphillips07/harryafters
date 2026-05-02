// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  nitro: {
    preset: 'vercel'
  },

  /* Server-only secrets. Populated from NUXT_* env vars (Vercel env or local .env). */
  runtimeConfig: {
    supabaseUrl: '',
    supabaseServiceKey: '',
    resendApiKey: '',
    resendAudienceId: '',
    /** Sender for transactional mail, e.g. `Harry Afters <hello@yourdomain.com>` or onboarding@resend.dev */
    resendFrom: '',
    adminToken: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    /** Entry ticket only in pence (not including booking fee). Default £6.00 = 600. */
    ticketPricePence: '600',
    /** Booking fee in pence (own line in Stripe Checkout). Default 30p. Total = ticket + booking (e.g. 630). */
    bookingFeePence: '30',
    public: {
      /** Public site origin used for Stripe success/cancel URLs and ticket links. */
      siteUrl: ''
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/favicon.ico': { redirect: { to: '/favicon.png', statusCode: 308 } }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
