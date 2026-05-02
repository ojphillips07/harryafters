<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

interface TicketResponse {
  id: string
  name: string
  status: string
  usedAt: string | null
  createdAt: string
  amountPence: number
  currency: string
}

const { data: ticket, error: fetchError } = await useFetch<TicketResponse>(
  () => `/api/tickets/${id.value}`,
  { key: () => `ticket-${id.value}` }
)

useHead({
  title: () =>
    ticket.value ? `Your ticket — Harry Afters` : 'Ticket not found — Harry Afters'
})

const qrPngUrl = computed(() => ticket.value?.id ? `/api/tickets/${ticket.value.id}/qr.png` : '')

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

const usedAtLabel = computed(() => {
  if (!ticket.value?.usedAt) return ''
  try {
    return new Date(ticket.value.usedAt).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return ticket.value.usedAt
  }
})
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate flex min-h-screen items-center justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md mx-auto">
        <div
          v-if="fetchError"
          class="p-12 rounded-3xl bg-gray-900/60 border border-gray-800 text-center"
        >
          <UIcon
            name="i-lucide-search-x"
            class="w-12 h-12 text-gray-500 mx-auto mb-4"
          />
          <h1 class="text-2xl font-bold mb-2">
            Ticket not found
          </h1>
          <p class="text-gray-400 text-sm leading-relaxed">
            We couldn't find a ticket with that ID. Make sure you're using the link from your confirmation email.
          </p>
          <NuxtLink
            to="/"
            class="inline-block mt-6 text-sm text-primary-300 hover:text-primary-200"
          >
            ← Back to the site
          </NuxtLink>
        </div>

        <div
          v-else-if="ticket"
          class="rounded-3xl border border-gray-800 bg-gray-900/60 backdrop-blur overflow-hidden"
        >
          <div class="h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
          <div class="p-8">
            <div class="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium">
              <span class="relative flex h-2 w-2">
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-400" />
              </span>
              {{ ticket.usedAt ? 'Ticket scanned' : 'Ticket valid' }}
            </div>

            <h1 class="font-[family-name:Bebas_Neue,sans-serif] text-5xl tracking-wider uppercase text-white leading-none">
              Entry ticket
            </h1>
            <p class="mt-3 text-gray-300">
              <span class="font-semibold text-white">{{ ticket.name }}</span> — Harry Afters
            </p>

            <div class="mt-6 rounded-2xl bg-white p-4 flex items-center justify-center">
              <img
                v-if="qrPngUrl"
                :src="qrPngUrl"
                :alt="`QR for ticket ${ticket.id}`"
                class="block w-60 h-60"
                width="240"
                height="240"
              >
              <div
                v-else
                class="w-60 h-60 grid place-items-center text-gray-500 text-sm"
              >
                Generating…
              </div>
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
            </div>

            <div class="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <div class="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                  Ticket ID
                </div>
                <div class="mt-1 font-mono text-xs text-gray-200 break-all">
                  {{ ticket.id }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                  Paid
                </div>
                <div class="mt-1 text-sm font-bold text-white">
                  {{ priceLabel }}
                </div>
              </div>
            </div>

            <div
              v-if="ticket.usedAt"
              class="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200"
            >
              Already scanned at <span class="font-semibold">{{ usedAtLabel }}</span>.
            </div>
            <div
              v-if="ticket.status === 'refunded'"
              class="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200"
            >
              This ticket has been refunded and is no longer valid.
            </div>
          </div>
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
