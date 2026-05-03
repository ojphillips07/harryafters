<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Door scan — Harry Afters',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOKEN_KEY = 'ha-admin-token'

interface CheckInTicket {
  id: string
  name: string
  usedAt: string | null
}

interface CheckInResponse {
  status: 'ok' | 'already_used' | 'refunded' | 'not_found'
  ticket?: CheckInTicket
}

interface ResultState {
  status: CheckInResponse['status'] | 'error'
  ticket?: CheckInTicket
  message?: string
  at: number
}

const token = ref('')
const tokenInput = ref('')
const manualId = ref('')
const lastResult = ref<ResultState | null>(null)
const cameraError = ref<string | null>(null)
const cameraReady = ref(false)
const usingFallback = ref(false)
const submitting = ref(false)
/** Blocks scanning until staff dismisses the last check-in outcome (any status). */
const resultModalOpen = ref(false)
const lastScanned = ref<{ id: string, at: number } | null>(null)

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let stream: MediaStream | null = null
let detector: { detect: (s: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null = null
let scanLoopId: number | null = null
let jsqrModule: typeof import('jsqr').default | null = null
/** Prevents overlapping BarcodeDetector/jsQR work (was stacking async frames). */
let detecting = false
/** jsQR: decode every Nth processed frame to cut CPU (~half the work). */
let jsQrFrameCounter = 0
const JSQR_FRAME_STRIDE = 2
/** Max width for jsQR canvas — full-res decode was the main bottleneck. */
const JSQR_MAX_WIDTH = 480

const SCROLL_LOCK_CLASS = 'ha-door-noscroll'
let doorScrollMql: MediaQueryList | null = null

function syncDoorScrollLock() {
  if (typeof document === 'undefined') return
  const mq = doorScrollMql ?? window.matchMedia('(max-width: 639px)')
  document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, mq.matches)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.sessionStorage.getItem(TOKEN_KEY)
  if (stored) {
    token.value = stored
    void startCamera()
  }
  doorScrollMql = window.matchMedia('(max-width: 639px)')
  doorScrollMql.addEventListener('change', syncDoorScrollLock)
  syncDoorScrollLock()
})

onBeforeUnmount(() => {
  if (doorScrollMql) {
    doorScrollMql.removeEventListener('change', syncDoorScrollLock)
    doorScrollMql = null
  }
  document.documentElement.classList.remove(SCROLL_LOCK_CLASS)
  stopCamera()
})

function saveToken() {
  const t = tokenInput.value.trim()
  if (!t) return
  token.value = t
  window.sessionStorage.setItem(TOKEN_KEY, t)
  tokenInput.value = ''
  void startCamera()
}

function clearToken() {
  stopCamera()
  token.value = ''
  window.sessionStorage.removeItem(TOKEN_KEY)
}

async function startCamera() {
  cameraError.value = null
  cameraReady.value = false
  usingFallback.value = false
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Camera not supported on this device — use the manual entry below.'
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 960 },
        height: { ideal: 960 },
        frameRate: { ideal: 30, max: 30 }
      }
    })
    await nextTick()
    const video = videoRef.value
    if (!video) return
    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    await video.play()
    cameraReady.value = true
  } catch (err) {
    cameraError.value = err instanceof Error
      ? `Couldn't open camera: ${err.message}`
      : 'Couldn\'t open camera.'
    return
  }

  const Detector = (globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => typeof detector }).BarcodeDetector
  if (Detector) {
    try {
      detector = new Detector({ formats: ['qr_code'] }) as typeof detector
      usingFallback.value = false
      scheduleScan()
      return
    } catch {
      detector = null
    }
  }

  usingFallback.value = true
  try {
    const mod = await import('jsqr')
    jsqrModule = mod.default
    scheduleScan()
  } catch (err) {
    cameraError.value = err instanceof Error
      ? `Couldn't load fallback scanner: ${err.message}`
      : 'Couldn\'t load fallback scanner.'
  }
}

function stopCamera() {
  if (scanLoopId !== null) {
    cancelAnimationFrame(scanLoopId)
    scanLoopId = null
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  cameraReady.value = false
}

function scheduleScan() {
  scanLoopId = requestAnimationFrame(() => {
    void scanTick()
  })
}

function decodeJsQrFromVideo(video: HTMLVideoElement): string | null {
  if (!jsqrModule) return null
  const canvas = canvasRef.value
  if (!canvas) return null

  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw <= 0 || vh <= 0) return null

  let dw = vw
  let dh = vh
  if (vw > JSQR_MAX_WIDTH) {
    dh = Math.round((vh * JSQR_MAX_WIDTH) / vw)
    dw = JSQR_MAX_WIDTH
  }

  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, dw, dh)
  const imgData = ctx.getImageData(0, 0, dw, dh)
  const found = jsqrModule(imgData.data, dw, dh, { inversionAttempts: 'attemptBoth' })
  return found?.data ?? null
}

async function scanTick() {
  if (!cameraReady.value) return

  if (submitting.value || resultModalOpen.value) {
    scheduleScan()
    return
  }
  if (detecting) {
    return
  }

  const video = videoRef.value
  if (!video || video.readyState < 2) {
    scheduleScan()
    return
  }

  detecting = true
  let value: string | null = null

  try {
    if (detector) {
      try {
        const codes = await detector.detect(video)
        if (codes.length > 0 && typeof codes[0]?.rawValue === 'string') {
          value = codes[0].rawValue
        }
      } catch {
        /* ignore frame error */
      }
    } else if (jsqrModule) {
      jsQrFrameCounter += 1
      if (jsQrFrameCounter % JSQR_FRAME_STRIDE === 0) {
        value = decodeJsQrFromVideo(video)
      }
    }

    if (value) {
      void handleScan(value.trim())
    }
  } finally {
    detecting = false
  }

  scheduleScan()
}

async function handleScan(payload: string) {
  if (!payload || submitting.value || resultModalOpen.value) return
  if (!UUID_RE.test(payload)) return

  const now = Date.now()
  if (lastScanned.value && lastScanned.value.id === payload && now - lastScanned.value.at < 1000) {
    lastResult.value = {
      status: 'error',
      message: 'Duplicate scan — dismiss to continue.',
      at: now
    }
    resultModalOpen.value = true
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30])
    }
    return
  }
  lastScanned.value = { id: payload, at: now }

  await submitCheckIn(payload)
}

async function submitManual() {
  if (resultModalOpen.value) return
  const v = manualId.value.trim()
  if (!v) return
  if (!UUID_RE.test(v)) {
    lastResult.value = { status: 'error', message: 'That doesn\'t look like a ticket ID.', at: Date.now() }
    resultModalOpen.value = true
    return
  }
  await submitCheckIn(v)
  manualId.value = ''
}

async function submitCheckIn(ticketId: string) {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await $fetch<CheckInResponse>('/api/admin/check-in', {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
      body: { ticketId }
    })
    lastResult.value = {
      status: res.status,
      ticket: res.ticket,
      at: Date.now()
    }
    resultModalOpen.value = true
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(res.status === 'ok' ? 80 : [40, 60, 40])
    }
  } catch (err) {
    let msg = 'Check-in failed.'
    if (err && typeof err === 'object' && 'data' in err) {
      const d = (err as { data?: { statusMessage?: string } }).data
      if (d?.statusMessage) msg = d.statusMessage
    }
    lastResult.value = { status: 'error', message: msg, at: Date.now() }
    resultModalOpen.value = true
  } finally {
    submitting.value = false
  }
}

const resultClass = computed(() => {
  const s = lastResult.value?.status
  if (s === 'ok') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  if (s === 'already_used') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  if (s === 'refunded') return 'border-orange-500/40 bg-orange-500/10 text-orange-200'
  if (s === 'not_found') return 'border-red-500/40 bg-red-500/10 text-red-200'
  if (s === 'error') return 'border-red-500/40 bg-red-500/10 text-red-200'
  return 'border-gray-800 bg-gray-900/40 text-gray-300'
})

const resultIcon = computed(() => {
  const s = lastResult.value?.status
  if (s === 'ok') return 'i-lucide-check-circle'
  if (s === 'already_used') return 'i-lucide-alert-triangle'
  if (s === 'refunded') return 'i-lucide-ban'
  if (s === 'not_found') return 'i-lucide-x-circle'
  if (s === 'error') return 'i-lucide-circle-alert'
  return 'i-lucide-qr-code'
})

const resultHeading = computed(() => {
  const s = lastResult.value?.status
  if (s === 'ok') return 'ADMIT'
  if (s === 'already_used') return 'ALREADY USED'
  if (s === 'refunded') return 'REFUNDED — REJECT'
  if (s === 'not_found') return 'NOT FOUND'
  if (s === 'error') return 'ERROR'
  return ''
})

const modalUi = computed(() => {
  const s = lastResult.value?.status
  let bar = 'border-gray-600/40 shadow-black/30'
  if (s === 'ok') bar = 'border-emerald-500/50 shadow-emerald-950/50'
  else if (s === 'already_used') bar = 'border-amber-500/50 shadow-amber-950/40'
  else if (s === 'refunded') bar = 'border-orange-500/50 shadow-orange-950/40'
  else if (s === 'not_found' || s === 'error') bar = 'border-red-500/50 shadow-red-950/40'
  return {
    overlay: 'backdrop-blur-sm bg-black/70',
    content: `max-w-md border-2 ${bar} bg-gray-950 shadow-2xl sm:max-w-lg`
  }
})

const modalTitleClass = computed(() => {
  const s = lastResult.value?.status
  if (s === 'ok') return 'text-emerald-400'
  if (s === 'already_used') return 'text-amber-400'
  if (s === 'refunded') return 'text-orange-400'
  if (s === 'not_found' || s === 'error') return 'text-red-400'
  return 'text-gray-200'
})

function formattedUsedAt(iso: string | null | undefined) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>

<style>
/* Phone-only: lock page scroll (rubber-band / overflow) while door scanner is open */
html.ha-door-noscroll,
html.ha-door-noscroll body {
  overflow: hidden;
  overscroll-behavior: none;
  height: 100%;
  width: 100%;
  touch-action: manipulation;
}
html.ha-door-noscroll body {
  position: fixed;
  inset: 0;
}
</style>

<template>
  <div
    class="relative bg-gray-950 text-gray-100 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:overflow-hidden sm:min-h-screen sm:overflow-clip"
  >
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate max-sm:flex max-sm:h-full max-sm:min-h-0 max-sm:flex-col max-sm:overflow-hidden max-sm:py-2 min-h-screen py-10 px-4 sm:px-6">
      <div class="w-full max-w-md mx-auto flex flex-col max-sm:h-full max-sm:min-h-0 space-y-6 max-sm:space-y-2">
        <header class="text-center shrink-0 max-sm:space-y-0.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 max-sm:px-2 max-sm:py-0.5 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm max-sm:text-xs font-medium">
            Door scan
          </div>
          <h1 class="mt-2 max-sm:mt-1 font-[family-name:Bebas_Neue,sans-serif] text-4xl max-sm:text-2xl tracking-wider uppercase leading-tight">
            Harry Afters
          </h1>
          <p class="mt-1 text-sm text-gray-400 max-sm:hidden">
            Point the back camera at the QR. Scan once per ticket.
          </p>
          <p class="mt-0.5 text-[11px] text-gray-500 sm:hidden">
            Dismiss each popup before the next scan.
          </p>
        </header>

        <!-- Token gate -->
        <div
          v-if="!token"
          class="p-6 max-sm:p-4 rounded-2xl bg-gray-900/60 border border-gray-800 max-sm:shrink-0"
        >
          <h2 class="font-bold mb-2">
            Enter admin token
          </h2>
          <p class="text-sm text-gray-400 mb-4">
            Same value as <code class="text-gray-300">NUXT_ADMIN_TOKEN</code>. Stored in this tab only.
          </p>
          <form
            class="space-y-3"
            @submit.prevent="saveToken"
          >
            <UInput
              v-model="tokenInput"
              type="password"
              placeholder="admin token"
              size="xl"
              autocomplete="off"
              class="w-full"
              required
            />
            <UButton
              type="submit"
              color="primary"
              block
              size="xl"
              class="font-bold rounded-2xl"
            >
              Unlock scanner
            </UButton>
          </form>
        </div>

        <!-- Scanner -->
        <div
          v-else
          class="flex min-h-0 flex-1 flex-col gap-2 sm:min-h-0 sm:flex-none sm:gap-6"
        >
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 sm:rounded-3xl sm:aspect-square sm:flex-none">
            <div class="relative min-h-0 flex-1 max-sm:min-h-[100px]">
              <video
                ref="videoRef"
                class="absolute inset-0 h-full w-full object-cover"
                muted
                playsinline
              />
              <canvas
                ref="canvasRef"
                class="hidden"
              />
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <div class="w-2/3 aspect-square rounded-2xl border-2 border-primary-400/70 shadow-[0_0_60px_rgba(236,72,153,0.4)]" />
              </div>
              <div
                v-if="!cameraReady"
                class="absolute inset-0 grid place-items-center bg-black/70 text-sm text-gray-300 px-6 text-center"
              >
                {{ cameraError ?? 'Starting camera…' }}
              </div>
            </div>
            <div class="flex shrink-0 items-center justify-between gap-2 border-t border-gray-800/80 px-2 py-1.5 text-[10px] text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
              <span class="truncate">{{ usingFallback ? 'jsqr' : 'Native detector' }}</span>
              <button
                type="button"
                class="shrink-0 text-gray-400 hover:text-primary-300"
                @click="clearToken"
              >
                Sign out
              </button>
            </div>
          </div>

          <form
            class="shrink-0 space-y-2 rounded-2xl border border-gray-800 bg-gray-900/40 p-2 sm:space-y-3 sm:p-4"
            @submit.prevent="submitManual"
          >
            <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:text-xs">Manual entry</label>
            <UInput
              v-model="manualId"
              placeholder="Ticket ID"
              autocomplete="off"
              class="w-full"
            />
            <UButton
              type="submit"
              color="neutral"
              block
              class="rounded-lg py-2 text-sm font-semibold sm:rounded-xl sm:py-2.5 sm:text-base"
            >
              Check in
            </UButton>
          </form>

          <div
            class="hidden rounded-3xl border p-6 transition-colors sm:block"
            :class="resultClass"
          >
            <template v-if="lastResult">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="resultIcon"
                  class="w-7 h-7"
                />
                <div class="font-[family-name:Bebas_Neue,sans-serif] text-3xl tracking-wider">
                  {{ resultHeading }}
                </div>
              </div>
              <div
                v-if="lastResult.ticket"
                class="mt-3"
              >
                <div class="text-xl font-bold text-white">
                  {{ lastResult.ticket.name }}
                </div>
                <div class="mt-1 font-mono text-[11px] break-all opacity-75">
                  {{ lastResult.ticket.id }}
                </div>
                <div
                  v-if="lastResult.ticket.usedAt"
                  class="mt-1 text-sm"
                >
                  Used at {{ formattedUsedAt(lastResult.ticket.usedAt) }}
                </div>
              </div>
              <div
                v-else-if="lastResult.message"
                class="mt-3 text-sm"
              >
                {{ lastResult.message }}
              </div>
              <div
                v-else-if="lastResult.status === 'not_found'"
                class="mt-3 text-sm"
              >
                That ticket isn't in our system. Check the QR or try manual entry.
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-3 text-gray-300">
                <UIcon
                  :name="resultIcon"
                  class="w-6 h-6"
                />
                <span>Waiting for first scan…</span>
              </div>
            </template>
          </div>

          <UModal
            v-model:open="resultModalOpen"
            :dismissible="false"
            :close="false"
            :ui="modalUi"
          >
            <template #title>
              <span
                class="flex items-center gap-2 text-xl font-black uppercase tracking-wider sm:text-2xl md:text-3xl"
                :class="modalTitleClass"
              >
                <UIcon
                  :name="resultIcon"
                  class="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                />
                {{ resultHeading }}
              </span>
            </template>
            <template #body>
              <div
                v-if="lastResult"
                class="space-y-3 sm:space-y-4"
              >
                <p
                  v-if="lastResult.ticket && (lastResult.status === 'ok' || lastResult.status === 'already_used' || lastResult.status === 'refunded')"
                  class="text-center text-2xl font-bold leading-tight text-white sm:text-3xl"
                >
                  {{ lastResult.ticket.name }}
                </p>
                <p
                  v-if="lastResult.ticket"
                  class="break-all text-center font-mono text-[11px] text-gray-500"
                >
                  {{ lastResult.ticket.id }}
                </p>
                <p
                  v-if="lastResult.ticket?.usedAt && lastResult.status === 'ok'"
                  class="text-center text-sm text-gray-400"
                >
                  Checked in {{ formattedUsedAt(lastResult.ticket.usedAt) }}
                </p>
                <p
                  v-if="lastResult.ticket?.usedAt && (lastResult.status === 'already_used' || lastResult.status === 'refunded')"
                  class="text-center text-sm text-gray-400"
                >
                  Used at {{ formattedUsedAt(lastResult.ticket.usedAt) }}
                </p>
                <p
                  v-if="lastResult.status === 'already_used'"
                  class="text-center text-sm text-amber-200/90"
                >
                  Duplicate scan — ticket was already used.
                </p>
                <p
                  v-if="lastResult.status === 'refunded'"
                  class="text-center text-sm text-orange-200/90"
                >
                  Do not admit — ticket was refunded.
                </p>
                <p
                  v-if="lastResult.status === 'not_found'"
                  class="text-center text-sm text-gray-300"
                >
                  That ticket isn't in our system. Check the QR or try manual entry.
                </p>
                <p
                  v-if="lastResult.status === 'error' && lastResult.message"
                  class="text-center text-sm text-gray-300"
                >
                  {{ lastResult.message }}
                </p>
                <UButton
                  :color="lastResult.status === 'ok' ? 'primary' : 'neutral'"
                  size="xl"
                  block
                  class="mt-4 font-bold rounded-2xl sm:mt-6"
                  @click="resultModalOpen = false"
                >
                  Dismiss
                </UButton>
              </div>
            </template>
          </UModal>
        </div>

        <div class="shrink-0 text-center max-sm:py-0.5">
          <NuxtLink
            to="/"
            class="text-[11px] text-gray-500 hover:text-primary-300 transition-colors sm:text-xs"
          >
            ← Back to the site
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
