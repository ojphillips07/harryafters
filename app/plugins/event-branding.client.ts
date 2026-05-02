import { EVENT_BRAND_NAMES } from '~/composables/useEventBranding'

export default defineNuxtPlugin(() => {
  const brandIndex = useState('afters-brand-index', () => 0)

  /* Match HeroRollingCube: 8s full spin → 2s per face */
  const intervalMs = 2000
  globalThis.setInterval(() => {
    brandIndex.value = (brandIndex.value + 1) % EVENT_BRAND_NAMES.length
  }, intervalMs)
})
