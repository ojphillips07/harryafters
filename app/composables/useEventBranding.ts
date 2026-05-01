/** Rotating event titles / names (keep in sync with plugin interval). */
export const EVENT_BRAND_NAMES = [
  'The Afters',
  'Afters at Harry\'s',
  'Fairfax Afters',
  'The After Party'
] as const

export function useEventBranding() {
  const brandIndex = useState('afters-brand-index', () => 0)

  const eventName = computed(
    () => EVENT_BRAND_NAMES[brandIndex.value % EVENT_BRAND_NAMES.length]!
  )

  return { brandIndex, eventName, brandNames: EVENT_BRAND_NAMES }
}
