<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@700;800&family=Syne:wght@700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap'
    }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Fairfax Afters · The After Party · The Afters | Year 13 Prom After Party'
const description = 'The Afters, Afters at Harry\'s, Fairfax Afters, The After Party — same night. Everyone’s gonna be there. Register your interest for the Fairfax Year 13 prom after party.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter class="border-t border-gray-800 bg-gray-950/50 backdrop-blur-md py-8">
      <template #left>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-400 flex flex-wrap items-baseline gap-x-1">
            <EventBrandName typography="inherit" />
            <span>• Fairfax Year 13 Prom After Party</span>
          </p>
          <p class="text-xs text-gray-500">
            © {{ new Date().getFullYear() }} • Non-profit event
          </p>
        </div>
      </template>

      <template #right>
        <div class="flex gap-4">
          <UButton
            label="Register Interest"
            to="#register"
            color="primary"
            variant="ghost"
            size="sm"
          />
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
