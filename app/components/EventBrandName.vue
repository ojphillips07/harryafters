<script setup lang="ts">
import { BRAND_TITLE_PARTS } from '~/composables/useEventBranding'

const props = withDefaults(
  defineProps<{
    /** Hero uses rotating display fonts; elsewhere inherits parent font. */
    typography?: 'hero' | 'inherit'
    /** First brand only — no layout jump when the hero cube/footer cycle changes. */
    stable?: boolean
  }>(),
  { typography: 'inherit', stable: false }
)

const { brandTitleParts, brandIndex, brandHeroFontClass } = useEventBranding()

const displayParts = computed(() =>
  props.stable ? BRAND_TITLE_PARTS[0]! : brandTitleParts.value
)

const fontClass = computed(() => {
  if (props.typography !== 'hero') return ''
  if (props.stable) return 'font-brand-hero-0'
  return brandHeroFontClass.value
})
</script>

<template>
  <span
    :class="[
      fontClass,
      typography === 'hero' ? 'inline-block max-w-full text-balance' : 'inline'
    ]"
  >
    <span
      v-for="(part, i) in displayParts"
      :key="stable ? `s-${i}-${part.text}` : `${brandIndex}-${i}-${part.text}`"
      :class="part.accent ? 'text-primary-500 drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]' : 'text-white'"
    >{{ part.text }}</span>
  </span>
</template>
