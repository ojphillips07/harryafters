<script setup lang="ts">
useHead({ title: 'Payment received — Harry Afters' })

definePageMeta({ layout: false })

const route = useRoute()
const sessionId = computed(() => {
  const v = route.query.session_id
  return typeof v === 'string' ? v : ''
})
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate flex min-h-screen items-center justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-xl mx-auto text-center">
        <div class="p-12 rounded-3xl bg-primary-500/10 border border-primary-500/25 backdrop-blur">
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
            Payment received. We're sending your ticket to your inbox right now — keep an eye out, including the spam folder if it doesn't show up in a minute.
          </p>
          <p class="text-gray-400 text-sm leading-relaxed mt-4">
            On the night, just show the QR code in your ticket email at the door.
          </p>
          <p
            v-if="sessionId"
            class="mt-6 text-xs text-gray-600 font-mono break-all"
          >
            Reference: {{ sessionId }}
          </p>
        </div>

        <div class="mt-8">
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
