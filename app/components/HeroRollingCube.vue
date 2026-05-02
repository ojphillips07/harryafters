<script setup lang="ts">
import { BRAND_TITLE_PARTS } from '~/composables/useEventBranding'

const faces = [0, 1, 2, 3] as const

/** Geometric face slot → brand index (+rotateX cycles faces the other way around the prism). */
const brandOnFace = [0, 3, 2, 1] as const
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
              :class="`font-brand-hero-${brandOnFace[i]}`"
            >
              <span
                v-for="(part, j) in BRAND_TITLE_PARTS[brandOnFace[i]]"
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
  /* Tighter perspective + centered origin = smaller pivot, less “swing” at the edges */
  perspective: min(85vw, 720px);
  perspective-origin: 50% 50%;
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
  /* Strong stop–start: long hold on each face, short roll (20s = 4 × 5s: ~4.5s hold + ~0.5s roll) */
  animation: cube-roll-step 20s linear infinite;
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
  /* Smaller radius = faces stay nearer the rotation axis (tighter, more central roll) */
  --cube-r: clamp(2rem, 6.5vmin, 3.75rem);
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

@keyframes cube-roll-step {
  /* Face 0 — hold */
  0%,
  22.5% {
    transform: rotateX(0deg);
  }

  /* Roll to face 1 */
  25% {
    transform: rotateX(90deg);
  }

  /* Hold face 1 */
  47.5% {
    transform: rotateX(90deg);
  }

  /* Roll to face 2 */
  50% {
    transform: rotateX(180deg);
  }

  /* Hold face 2 */
  72.5% {
    transform: rotateX(180deg);
  }

  /* Roll to face 3 */
  75% {
    transform: rotateX(270deg);
  }

  /* Hold face 3 */
  97.5% {
    transform: rotateX(270deg);
  }

  /* Roll back to face 0 (same visual as 0deg) */
  100% {
    transform: rotateX(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cube-track {
    animation: none;
    transform: rotateX(0deg);
  }
}
</style>
