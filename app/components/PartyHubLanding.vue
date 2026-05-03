<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

/** True when `/` is overridden by party hub (`NUXT_PUBLIC_PARTY_HUB_HOMEPAGE`). */
const partyHubHomepageEnv = computed(() => {
  const v = runtimeConfig.public.partyHubHomepage as unknown
  return v === true || v === 'true' || v === '1'
})

const { data: siteMode } = await useFetch<{ ticketsLive: boolean }>('/api/site-mode', {
  key: 'site-mode'
})
const ticketsLive = computed(() => siteMode.value?.ticketsLive === true)

const secondaryTo = computed(() => {
  if (ticketsLive.value) return '/buy'
  if (partyHubHomepageEnv.value) return { path: '/', query: { site: 'full' } }
  return '/'
})

useHead({
  title: 'Tonight — Harry Afters · Party hub',
  meta: [
    { name: 'theme-color', content: '#030712' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ]
})

useSeoMeta({
  title: 'Tonight — Harry Afters · Party hub',
  description:
    'Tonight’s Fairfax Year 13 prom after party — queue songs on the live jukebox: search, vote, and hear them play.',
  ogTitle: 'Tonight — Harry Afters · Party hub',
  ogDescription:
    'Queue songs on the live jukebox — search, vote, and hear them play at Harry Afters.'
})
</script>

<template>
  <div class="relative overflow-clip bg-gray-950">
    <div
      class="pointer-events-none absolute -left-[25%] top-[10%] h-[50%] w-[55%] rounded-full bg-primary-500/15 blur-[100px]"
    />
    <div
      class="pointer-events-none absolute -right-[20%] bottom-[15%] h-[45%] w-[50%] rounded-full bg-accent-500/12 blur-[110px]"
    />

    <section class="relative isolate flex min-h-[calc(100dvh-12rem)] flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <picture>
          <source
            srcset="/images/hero-venue.webp"
            type="image/webp"
          >
          <img
            src="/images/hero-venue.jpg"
            alt=""
            class="absolute inset-0 h-full w-full object-cover object-[50%_60%] opacity-35"
            decoding="async"
          >
        </picture>
        <div class="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/88 to-gray-950" />
        <div class="absolute inset-0 party-grain opacity-30 mix-blend-overlay" />
      </div>

      <div class="mx-auto w-full max-w-2xl text-center">
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-4 py-1.5 text-sm font-semibold text-accent-200 backdrop-blur-sm"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75"
            />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
          </span>
          Tonight · Party hub
        </div>

        <h1 class="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
          <EventBrandName
            typography="hero"
            stable
          />
        </h1>

        <p class="mx-auto mb-10 max-w-lg text-pretty text-lg text-gray-300 sm:text-xl">
          Welcome — queue songs for the room’s live jukebox. Search tracks, bump what you love, and hear it through the speakers.
        </p>

        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <UButton
            to="/jukebox"
            size="xl"
            color="primary"
            class="justify-center font-semibold shadow-lg shadow-primary-500/20"
            icon="i-lucide-disc-3"
          >
            Open the live jukebox
          </UButton>
          <UButton
            :to="secondaryTo"
            size="xl"
            variant="outline"
            color="neutral"
            class="justify-center border-gray-600 bg-gray-950/40 font-semibold text-white backdrop-blur-sm"
            :icon="ticketsLive ? 'i-lucide-ticket' : 'i-lucide-house'"
          >
            {{ ticketsLive ? 'Buy tickets' : 'Full event site' }}
          </UButton>
        </div>

        <div class="mt-14 grid gap-4 text-left sm:grid-cols-3 sm:gap-5">
          <div
            class="rounded-2xl border border-gray-800/80 bg-gray-950/60 p-5 backdrop-blur-md"
          >
            <UIcon
              name="i-lucide-search"
              class="mb-3 h-8 w-8 text-primary-400"
            />
            <p class="font-semibold text-white">
              Search
            </p>
            <p class="mt-1 text-sm text-gray-400">
              Find tracks on Spotify and add them from your phone.
            </p>
          </div>
          <div
            class="rounded-2xl border border-gray-800/80 bg-gray-950/60 p-5 backdrop-blur-md"
          >
            <UIcon
              name="i-lucide-thumbs-up"
              class="mb-3 h-8 w-8 text-accent-400"
            />
            <p class="font-semibold text-white">
              Vote
            </p>
            <p class="mt-1 text-sm text-gray-400">
              Bump songs up the list — highest votes play sooner.
            </p>
          </div>
          <div
            class="rounded-2xl border border-gray-800/80 bg-gray-950/60 p-5 backdrop-blur-md sm:col-span-1"
          >
            <UIcon
              name="i-lucide-speaker"
              class="mb-3 h-8 w-8 text-primary-400"
            />
            <p class="font-semibold text-white">
              Hear it live
            </p>
            <p class="mt-1 text-sm text-gray-400">
              The queue feeds the room speakers — one fair playlist for everyone.
            </p>
          </div>
        </div>

        <p class="mt-12 text-xs text-gray-500">
          Tip: add this page to your home screen for quick access tonight.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.party-grain {
  background-image:
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.1), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.06), transparent 60%),
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.025) 0 1px,
      transparent 1px 3px
    );
}
</style>
