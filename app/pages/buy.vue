<script setup lang="ts">
useHead({
  title: 'Buy a ticket — Harry Afters',
  meta: [
    { name: 'description', content: 'Buy your ticket to Harry Afters — Year 13 prom after party at Harry’s.' }
  ]
})

definePageMeta({ layout: false })

const { data: pricing } = await useFetch<{
  totalPence: number | null
  bookingPence: number | null
  entryPence: number | null
  labels: { total: string, booking: string, entry: string } | null
}>('/api/ticket-pricing')

function getCheckoutErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const data = e.data as Record<string, unknown> | undefined
    const msg
      = (data?.statusMessage as string | undefined)
        || (data?.message as string | undefined)
        || (e.statusMessage as string | undefined)
        || (e.message as string | undefined)
    if (typeof msg === 'string' && msg.trim().length > 0) return msg
  }
  return 'Something went wrong. Please try again.'
}

const loading = ref(false)
const errorMessage = ref<string | null>(null)

const form = reactive({
  name: '',
  email: '',
  agreed: false,
  fax_extension: ''
})

const onBuy = async () => {
  errorMessage.value = null
  if (!form.agreed) {
    errorMessage.value = 'Please tick the box to agree to the terms before continuing.'
    return
  }
  loading.value = true
  try {
    const result = await $fetch<{ ok: boolean, url: string }>('/api/checkout', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        fax_extension: form.fax_extension
      }
    })
    if (result?.url) {
      window.location.href = result.url
    } else {
      errorMessage.value = 'Could not start checkout. Try again.'
    }
  } catch (err) {
    errorMessage.value = getCheckoutErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate flex min-h-screen items-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-xl mx-auto">
        <div class="text-center mb-10">
          <div class="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium backdrop-blur">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            Tickets live
          </div>

          <h1 class="text-4xl md:text-5xl font-black tracking-tight">
            Grab a ticket
          </h1>
          <p class="mt-3 text-base md:text-lg text-gray-300 leading-relaxed">
            Year 13 prom after party at <span class="font-semibold text-white">Harry's</span>.
            <span class="text-white font-semibold">25 June · starts 10pm.</span>
            We'll email your ticket the second payment clears.
          </p>

          <div
            v-if="pricing?.labels"
            class="mt-8 rounded-2xl border border-primary-500/25 bg-gray-950/80 px-5 py-4 text-left text-sm text-gray-300 shadow-[0_0_24px_rgba(236,72,153,0.12)]"
          >
            <div class="flex justify-between gap-4 border-b border-gray-800 pb-3">
              <span>Entry ticket</span>
              <span class="shrink-0 font-semibold text-white tabular-nums">{{ pricing.labels.entry }}</span>
            </div>
            <div class="flex justify-between gap-4 pt-3">
              <span class="text-gray-400">
                Booking and card fee <span class="text-gray-500">(separate line — not hidden in the ticket price)</span>
              </span>
              <span class="shrink-0 font-semibold text-primary-300 tabular-nums">{{ pricing.labels.booking }}</span>
            </div>
            <div class="mt-4 flex justify-between gap-4 border-t border-gray-800 pt-3 text-base">
              <span class="font-bold text-white">Total you pay</span>
              <span class="shrink-0 font-black text-primary-400 tabular-nums">{{ pricing.labels.total }}</span>
            </div>
            <p class="mt-3 text-xs leading-snug text-gray-400">
              One payment of {{ pricing.labels.total }}: that total includes both lines above — {{ pricing.labels.entry }} entry plus {{ pricing.labels.booking }} fee.
              Stripe Checkout lists them separately so the fee stays obvious.
            </p>
            <p class="mt-2 text-xs leading-snug text-gray-500">
              Same breakdown on the hosted payment page — pink button, dark theme, Harry Afters branding.
            </p>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-gray-900/50 border border-gray-800 glow-box backdrop-blur">
          <form
            class="space-y-6"
            @submit.prevent="onBuy"
          >
            <UFormField
              label="Full name"
              name="name"
            >
              <UInput
                v-model="form.name"
                placeholder="John Doe"
                size="xl"
                class="w-full"
                required
              />
            </UFormField>

            <UFormField
              label="Email"
              name="email"
              help="We'll send the ticket here. Use the email you actually check."
            >
              <UInput
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                size="xl"
                class="w-full"
                required
              />
            </UFormField>

            <div
              aria-hidden="true"
              class="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
            >
              <label>
                Leave this field empty
                <input
                  v-model="form.fax_extension"
                  type="text"
                  name="fax_extension"
                  tabindex="-1"
                  autocomplete="off"
                >
              </label>
            </div>

            <label class="flex items-start gap-3 text-sm text-gray-300 select-none">
              <input
                v-model="form.agreed"
                type="checkbox"
                class="mt-1 h-4 w-4 accent-primary-500 cursor-pointer"
                required
              >
              <span>
                I'm buying one ticket for myself, I understand it's <span class="text-white font-semibold">non-refundable</span>, and I'll bring my QR code (and any drinks I want to drink — BYOB) on the night.
              </span>
            </label>

            <UButton
              type="submit"
              size="xl"
              color="primary"
              block
              :loading="loading"
              :disabled="!form.agreed"
              class="font-bold py-4 rounded-2xl"
            >
              Pay & get my ticket
            </UButton>

            <p
              v-if="errorMessage"
              class="text-sm text-red-400 text-center"
              role="alert"
            >
              {{ errorMessage }}
            </p>

            <p class="text-center text-xs text-gray-500 leading-relaxed">
              Payment is handled by Stripe (hosted checkout, themed for Harry Afters). Card, Apple Pay & Google Pay supported.
            </p>
          </form>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink
            to="/"
            class="text-sm text-gray-400 hover:text-primary-300 transition-colors"
          >
            ← Back to the site
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.glow-box {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.18);
}
</style>
