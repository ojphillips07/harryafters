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
const lastScanned = ref<{ id: string, at: number } | null>(null)

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let stream: MediaStream | null = null
let detector: { detect: (s: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null = null
let scanLoopId: number | null = null
let jsqrModule: typeof import('jsqr').default | null = null

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.sessionStorage.getItem(TOKEN_KEY)
  if (stored) {
    token.value = stored
    void startCamera()
  }
})

onBeforeUnmount(() => {
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
      video: { facingMode: { ideal: 'environment' } },
      audio: false
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
  scanLoopId = requestAnimationFrame(scanFrame)
}

async function scanFrame() {
  if (!cameraReady.value) return
  const video = videoRef.value
  if (!video || video.readyState < 2) {
    scheduleScan()
    return
  }

  let value: string | null = null

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
    const canvas = canvasRef.value
    if (canvas) {
      const w = video.videoWidth
      const h = video.videoHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h)
          const imgData = ctx.getImageData(0, 0, w, h)
          const found = jsqrModule(imgData.data, w, h, { inversionAttempts: 'attemptBoth' })
          if (found?.data) value = found.data
        }
      }
    }
  }

  if (value) {
    void handleScan(value.trim())
  }

  scheduleScan()
}

async function handleScan(payload: string) {
  if (!payload || submitting.value) return
  if (!UUID_RE.test(payload)) return

  const now = Date.now()
  if (lastScanned.value && lastScanned.value.id === payload && now - lastScanned.value.at < 2500) {
    return
  }
  lastScanned.value = { id: payload, at: now }

  await submitCheckIn(payload)
}

async function submitManual() {
  const v = manualId.value.trim()
  if (!v) return
  if (!UUID_RE.test(v)) {
    lastResult.value = { status: 'error', message: 'That doesn\'t look like a ticket ID.', at: Date.now() }
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

function formattedUsedAt(iso: string | null | undefined) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate min-h-screen py-10 px-4 sm:px-6">
      <div class="w-full max-w-md mx-auto space-y-6">
        <header class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium">
            Door scan
          </div>
          <h1 class="mt-3 font-[family-name:Bebas_Neue,sans-serif] text-4xl tracking-wider uppercase">
            Harry Afters
          </h1>
          <p class="mt-1 text-sm text-gray-400">
            Point the back camera at the QR. Scan once per ticket.
          </p>
        </header>

        <!-- Token gate -->
        <div
          v-if="!token"
          class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800"
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
        <template v-else>
          <div class="rounded-3xl border border-gray-800 bg-gray-900/40 overflow-hidden">
            <div class="aspect-square relative bg-black">
              <video
                ref="videoRef"
                class="h-full w-full object-cover"
                muted
                playsinline
              />
              <canvas
                ref="canvasRef"
                class="hidden"
              />
              <!-- Scan reticle -->
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
            <div class="px-4 py-3 text-xs text-gray-500 flex items-center justify-between gap-3">
              <span>{{ usingFallback ? 'Fallback scanner (jsqr)' : 'Native QR detector' }}</span>
              <button
                class="text-gray-400 hover:text-primary-300"
                @click="clearToken"
              >
                Sign out
              </button>
            </div>
          </div>

          <!-- Manual entry -->
          <form
            class="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3"
            @submit.prevent="submitManual"
          >
            <label class="block text-xs font-bold uppercase tracking-widest text-gray-400">Manual entry</label>
            <UInput
              v-model="manualId"
              placeholder="Paste / type ticket ID"
              autocomplete="off"
              class="w-full"
            />
            <UButton
              type="submit"
              color="neutral"
              block
              class="font-semibold rounded-xl"
            >
              Check in
            </UButton>
          </form>

          <!-- Result panel -->
          <div
            class="rounded-3xl border p-6 transition-colors"
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
        </template>

        <div class="text-center">
          <NuxtLink
            to="/"
            class="text-xs text-gray-500 hover:text-primary-300 transition-colors"
          >
            ← Back to the site
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
