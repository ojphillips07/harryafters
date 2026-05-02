<script setup lang="ts">
import { BRAND_TITLE_PARTS } from '~/composables/useEventBranding'

const faces = [0, 1, 2, 3] as const
</script>

<template>
  <div class="cube-stage hero-brand-slot mb-6">
    <div class="cube-pivot">
      <div class="cube-track">
        <div
          v-for="i in faces"
          :key="i"
          class="cube-face"
          :class="`cube-face--${i}`"
        >
          <div class="cube-face-inner hero-brand-layer hero-brand-size">
            <span
              class="inline-block max-w-full text-balance"
              :class="`font-brand-hero-${i}`"
            >
              <span
                v-for="(part, j) in BRAND_TITLE_PARTS[i]"
                :key="j"
                :class="part.accent ? 'text-primary-500 drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]' : 'text-white'"
              >{{ part.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Rolling prism (4 faces) — continuous rotateX “rolling down” */
.cube-stage {
  perspective: min(110vw, 1200px);
  perspective-origin: 50% 45%;
}

.cube-pivot {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.cube-track {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform-origin: center center;
  animation: cube-roll-down 8s linear infinite;
  will-change: transform;
}

.cube-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: 0.5rem;
  text-align: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* Half cross-section depth so 4 faces meet — tuned for slot height */
  --cube-r: clamp(3.25rem, 11vmin, 6.25rem);
}

.cube-face--0 {
  transform: rotateX(0deg) translateZ(var(--cube-r));
}

.cube-face--1 {
  transform: rotateX(90deg) translateZ(var(--cube-r));
}

.cube-face--2 {
  transform: rotateX(180deg) translateZ(var(--cube-r));
}

.cube-face--3 {
  transform: rotateX(270deg) translateZ(var(--cube-r));
}

.cube-face-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

@keyframes cube-roll-down {
  from {
    transform: rotateX(0deg);
  }

  to {
    transform: rotateX(-360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cube-track {
    animation: none;
    transform: rotateX(0deg);
  }
}
</style>
