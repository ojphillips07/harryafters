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
    /**
     * Full amount charged in pence (£6.30 = 630). Entry line on Stripe = this minus booking fee.
     * Prefer this over ticketPricePence so you never double-add the fee (630 entry + 30 fee = £6.60 by mistake).
     */
    checkoutTotalPence: '',
    /** Legacy: entry ticket only in pence (e.g. 600). Ignored if checkoutTotalPence is set. */
    ticketPricePence: '',
    /** Booking fee in pence (separate Stripe line). Default 30p. */
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
