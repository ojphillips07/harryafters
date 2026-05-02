import { EVENT_BRAND_NAMES } from '~/composables/useEventBranding'

export default defineNuxtPlugin(() => {
  const brandIndex = useState('afters-brand-index', () => 0)

  /* Match HeroRollingCube: 20s loop, new face every 5s (~4.5s hold + ~0.5s roll) */
  const intervalMs = 5000
  globalThis.setInterval(() => {
    brandIndex.value = (brandIndex.value + 1) % EVENT_BRAND_NAMES.length
  }, intervalMs)
})
