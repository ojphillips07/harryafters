<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Hero uses rotating display fonts; elsewhere inherits parent font. */
    typography?: 'hero' | 'inherit'
  }>(),
  { typography: 'inherit' }
)

const { brandTitleParts, brandIndex, brandHeroFontClass } = useEventBranding()

const fontClass = computed(() =>
  props.typography === 'hero' ? brandHeroFontClass.value : ''
)
</script>

<template>
  <span
    :class="[
      fontClass,
      typography === 'hero' ? 'inline-block max-w-full text-balance' : 'inline'
    ]"
  >
    <span
      v-for="(part, i) in brandTitleParts"
      :key="`${brandIndex}-${i}-${part.text}`"
      :class="part.accent ? 'text-primary-500 drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]' : 'text-white'"
    >{{ part.text }}</span>
  </span>
</template>
