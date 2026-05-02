<script setup lang="ts">
useHead({ title: 'Payment cancelled — Harry Afters' })

definePageMeta({ layout: false })
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate flex min-h-screen items-center justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-xl mx-auto text-center">
        <div class="p-12 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur">
          <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 border border-gray-700">
            <UIcon
              name="i-lucide-x"
              class="w-12 h-12 text-gray-300"
            />
          </div>
          <h1 class="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            No charge made.
          </h1>
          <p class="text-gray-300 text-lg leading-relaxed">
            Looks like you cancelled before paying. Nothing has come off your card. Want to try again?
          </p>
        </div>

        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <UButton
            to="/buy"
            size="lg"
            color="primary"
            class="font-bold rounded-2xl"
          >
            Try again
          </UButton>
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
