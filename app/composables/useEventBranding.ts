/** Rotating event titles / names (keep in sync with plugin interval). */
export const EVENT_BRAND_NAMES = [
  'The Afters',
  'Afters at Harry\'s',
  'Fairfax Afters',
  'The After Party'
] as const

/** Split for styling: accent = pink (only “Afters” or “After Party”), rest white. */
export type BrandTitlePart = { text: string; accent: boolean }

export const BRAND_TITLE_PARTS: BrandTitlePart[][] = [
  [{ text: 'The ', accent: false }, { text: 'Afters', accent: true }],
  [{ text: 'Afters', accent: true }, { text: ' at Harry\'s', accent: false }],
  [{ text: 'Fairfax ', accent: false }, { text: 'Afters', accent: true }],
  [{ text: 'The ', accent: false }, { text: 'After Party', accent: true }]
]

export function useEventBranding() {
  const brandIndex = useState('afters-brand-index', () => 0)

  const eventName = computed(
    () => EVENT_BRAND_NAMES[brandIndex.value % EVENT_BRAND_NAMES.length]!
  )

  const brandTitleParts = computed(
    () => BRAND_TITLE_PARTS[brandIndex.value % BRAND_TITLE_PARTS.length]!
  )

  /** Per-rotation display font (hero only). */
  const brandHeroFontClass = computed(
    () => `font-brand-hero-${brandIndex.value % BRAND_TITLE_PARTS.length}`
  )

  return {
    brandIndex,
    eventName,
    brandNames: EVENT_BRAND_NAMES,
    brandTitleParts,
    brandHeroFontClass
  }
}
