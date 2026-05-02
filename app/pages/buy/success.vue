<script setup lang="ts">
useHead({ title: 'Payment received — Harry Afters' })

definePageMeta({ layout: false })

const route = useRoute()

const sessionId = computed(() => {
  const v = route.query.session_id
  return typeof v === 'string' && v.length > 0 ? v : ''
})

interface TicketPayload {
  id: string
  name: string
  email: string
  status: string
  usedAt: string | null
  createdAt: string
  amountPence: number
  currency: string
}

type SessionTicketResponse =
  | { pending: true; customerEmail: string | null }
  | { pending: false; ticket: TicketPayload }

const ticket = ref<TicketPayload | null>(null)
const pendingWebhook = ref(false)
const customerEmailHint = ref<string | null>(null)
const pollTimedOut = ref(false)
const fetchError = ref<string | null>(null)

const qrPngUrl = computed(() =>
  ticket.value?.id ? `/api/tickets/${ticket.value.id}/qr.png` : ''
)

const priceLabel = computed(() => {
  if (!ticket.value) return ''
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: ticket.value.currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(ticket.value.amountPence / 100)
  } catch {
    return `${(ticket.value.amountPence / 100).toFixed(2)} ${ticket.value.currency.toUpperCase()}`
  }
})

let pollTimer: ReturnType<typeof setInterval> | null = null
let giveUpTimer: ReturnType<typeof setTimeout> | null = null

async function pollTicket() {
  if (!sessionId.value) return

  try {
    const res = await $fetch<SessionTicketResponse>(
      `/api/tickets/by-session/${encodeURIComponent(sessionId.value)}`
    )
    if (!res.pending) {
      ticket.value = res.ticket
      pendingWebhook.value = false
      stopPolling()
    } else {
      pendingWebhook.value = true
      customerEmailHint.value = res.customerEmail
    }
    fetchError.value = null
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    const msg
      = err?.data?.statusMessage || err?.statusMessage || 'Could not load your ticket.'
    fetchError.value = msg
    stopPolling()
  }
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (giveUpTimer !== null) {
    clearTimeout(giveUpTimer)
    giveUpTimer = null
  }
}

onMounted(() => {
  if (!sessionId.value) return

  void pollTicket()
  pollTimer = setInterval(pollTicket, 2000)
  giveUpTimer = setTimeout(() => {
    if (ticket.value) return
    pollTimedOut.value = true
    stopPolling()
  }, 60_000)
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate flex min-h-screen items-center justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md mx-auto">
        <!-- No session id (e.g. honeypot) — generic confirmation -->
        <div
          v-if="!sessionId"
          class="p-10 sm:p-12 rounded-3xl bg-primary-500/10 border border-primary-500/25 backdrop-blur text-center"
        >
          <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20 border border-primary-500/40">
            <UIcon
              name="i-lucide-check-circle"
              class="w-12 h-12 text-primary-400"
            />
          </div>
          <h1 class="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            You're in.
          </h1>
          <p class="text-gray-300 text-lg leading-relaxed">
            If you just paid, check your inbox for your ticket and QR code. It can take a minute — try spam too.
          </p>
          <div class="mt-8">
            <NuxtLink
              to="/"
              class="text-sm text-gray-400 hover:text-primary-300 transition-colors"
            >
              ← Back to the site
            </NuxtLink>
          </div>
        </div>

        <!-- API / session error -->
        <div
          v-else-if="fetchError"
          class="p-10 rounded-3xl bg-gray-900/60 border border-gray-800 text-center"
        >
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 class="text-xl font-bold mb-2">
            Something went wrong
          </h1>
          <p class="text-gray-400 text-sm leading-relaxed">
            {{ fetchError }}
          </p>
          <p class="text-gray-500 text-xs mt-4 leading-relaxed">
            If payment went through, you should still get an email with your QR. You can also use the link in that email later.
          </p>
          <NuxtLink
            to="/"
            class="inline-block mt-6 text-sm text-primary-300 hover:text-primary-200"
          >
            ← Back to the site
          </NuxtLink>
        </div>

        <!-- Paid: full success + optional QR -->
        <template v-else>
          <div class="rounded-3xl border border-gray-800 bg-gray-900/60 backdrop-blur overflow-hidden">
            <div class="h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
            <div class="p-8 text-center">
              <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20 border border-primary-500/40">
                <UIcon
                  name="i-lucide-check-circle"
                  class="w-9 h-9 text-primary-400"
                />
              </div>
              <h1 class="text-3xl font-black mb-2 tracking-tight text-white">
                Payment successful
              </h1>
              <p class="text-gray-300 text-base leading-relaxed">
                Your purchase went through. We’ve sent your ticket with a QR code to your inbox
                <template v-if="ticket?.email || customerEmailHint">
                  (<span class="text-white font-semibold">{{ ticket?.email || customerEmailHint }}</span>)
                </template>
                — check spam if you don’t see it within a couple of minutes.
              </p>

              <div
                v-if="pendingWebhook && !ticket"
                class="mt-8 rounded-2xl border border-primary-500/25 bg-primary-500/5 px-4 py-6"
              >
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary-400 mx-auto mb-3 animate-spin" />
                <p class="text-sm text-gray-300">
                  Preparing your ticket…
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Almost there — this usually takes a few seconds.
                </p>
              </div>

              <div
                v-if="pollTimedOut && !ticket"
                class="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-left"
              >
                <p class="text-sm text-amber-100">
                  Your ticket is taking longer than usual to appear here. You should still receive the confirmation email — use the link inside to open your QR anytime.
                </p>
              </div>

              <template v-if="ticket">
                <p class="mt-8 text-left text-sm text-gray-400">
                  <span class="font-semibold text-white">{{ ticket.name }}</span> — Harry Afters · {{ priceLabel }}
                </p>
                <div class="mt-4 rounded-2xl bg-white p-4 flex items-center justify-center">
                  <img
                    v-if="qrPngUrl"
                    :src="qrPngUrl"
                    :alt="`QR for ticket ${ticket.id}`"
                    class="block w-60 h-60"
                    width="240"
                    height="240"
                  >
                </div>
                <p class="mt-3 text-center text-sm text-gray-400">
                  Show this at the door. One scan only.
                </p>
                <div class="mt-4 grid grid-cols-1 gap-3">
                  <a
                    v-if="qrPngUrl"
                    :href="qrPngUrl"
                    download="harry-afters-ticket-qr.png"
                    class="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500/15 border border-primary-500/35 px-4 py-3 text-sm font-bold text-primary-200 hover:bg-primary-500/20 transition-colors"
                  >
                    <UIcon name="i-lucide-download" class="w-4 h-4" />
                    Save QR to camera roll
                  </a>
                  <NuxtLink
                    :to="`/tickets/${ticket.id}`"
                    class="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950/40 border border-white/10 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-950/55 transition-colors"
                  >
                    <UIcon name="i-lucide-ticket" class="w-4 h-4" />
                    Open full ticket page
                  </NuxtLink>
                </div>
              </template>
            </div>
          </div>

          <p
            v-if="sessionId"
            class="mt-6 text-center text-[11px] text-gray-600 font-mono break-all"
          >
            Reference: {{ sessionId }}
          </p>

          <div class="mt-8 text-center">
            <NuxtLink
              to="/"
              class="text-sm text-gray-400 hover:text-primary-300 transition-colors"
            >
              ← Back to the site
            </NuxtLink>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
