<script setup>
const { eventName } = useEventBranding()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'The Afters · Afters at Harry\'s | Fairfax Year 13 Prom After Party'
const description = 'Same night — two names: The Afters and Afters at Harry\'s. Everyone’s gonna be there. Register your interest for the Fairfax Year 13 Prom After Party.'

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
          <p class="text-sm text-gray-400">
            {{ eventName }} • Fairfax Year 13 Prom After Party
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
