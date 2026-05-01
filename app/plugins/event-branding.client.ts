import { EVENT_BRAND_NAMES } from '~/composables/useEventBranding'

export default defineNuxtPlugin(() => {
  const brandIndex = useState('afters-brand-index', () => 0)

  const intervalMs = 2200
  globalThis.setInterval(() => {
    brandIndex.value = (brandIndex.value + 1) % EVENT_BRAND_NAMES.length
  }, intervalMs)
})
