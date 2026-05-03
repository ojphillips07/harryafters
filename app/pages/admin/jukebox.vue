<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Jukebox — DJ console',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

interface QueueRow {
  id: string
  track_id: string
  track_uri: string
  track_name: string
  artist: string
  album_image: string | null
  duration_ms: number
  votes: number
  status: 'queued' | 'enqueued_spotify' | 'now_playing' | 'played' | 'skipped' | 'removed'
  first_added_at: string
  last_voted_at: string
}

interface NowPlayingRow {
  queue_id: string | null
  track_uri: string | null
  track_id: string | null
  track_name: string | null
  artist: string | null
  album_image: string | null
  progress_ms: number
  duration_ms: number
  device_name: string | null
  is_playing: boolean
  updated_at: string
}

const TOKEN_KEY = 'ha-admin-token'
const POLL_MS = 3_000

const token = ref('')
const tokenInput = ref('')
const queue = ref<QueueRow[]>([])
const nowPlaying = ref<NowPlayingRow | null>(null)
const flash = ref<{ message: string, kind: 'ok' | 'info' | 'error' } | null>(null)
const acting = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

function flashMessage(message: string, kind: 'ok' | 'info' | 'error' = 'info') {
  flash.value = { message, kind }
  if (flashTimer) {
    clearTimeout(flashTimer)
  }
  flashTimer = setTimeout(() => {
    flash.value = null
  }, 3_000)
}

function saveToken() {
  const t = tokenInput.value.trim()
  if (!t) return
  token.value = t
  window.sessionStorage.setItem(TOKEN_KEY, t)
  tokenInput.value = ''
  void refresh()
}

function clearToken() {
  token.value = ''
  window.sessionStorage.removeItem(TOKEN_KEY)
  queue.value = []
  nowPlaying.value = null
}

async function refresh() {
  if (!token.value) return
  try {
    const [q, np] = await Promise.all([
      $fetch<{ queue: QueueRow[] }>('/api/jukebox/queue'),
      $fetch<{ nowPlaying: NowPlayingRow | null }>('/api/jukebox/now-playing')
    ])
    queue.value = q.queue ?? []
    nowPlaying.value = np.nowPlaying ?? null
  } catch {
    /* ignore polling blips */
  }
}

async function skipNow() {
  if (acting.value) return
  acting.value = 'skip'
  try {
    const res = await $fetch<{ ok: boolean, skipped: { track_name: string } | null, note?: string }>('/api/admin/jukebox/skip', {
      method: 'POST',
      headers: { 'x-admin-token': token.value }
    })
    if (res.skipped) {
      flashMessage(`Skipped ${res.skipped.track_name}.`, 'ok')
    } else {
      flashMessage(res.note ?? 'Nothing playing.', 'info')
    }
    await refresh()
  } catch (err) {
    flashMessage(extractMsg(err) ?? 'Skip failed.', 'error')
  } finally {
    acting.value = null
  }
}

async function removeRow(row: QueueRow) {
  if (acting.value) return
  acting.value = row.id
  try {
    const res = await $fetch<{ ok: boolean, note?: string }>('/api/admin/jukebox/remove', {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
      body: { queueId: row.id }
    })
    if (res.ok) {
      flashMessage(`Removed ${row.track_name}.`, 'ok')
    } else {
      flashMessage(res.note ?? 'Could not remove.', 'info')
    }
    queue.value = queue.value.filter(r => r.id !== row.id)
    void refresh()
  } catch (err) {
    flashMessage(extractMsg(err) ?? 'Remove failed.', 'error')
  } finally {
    acting.value = null
  }
}

function extractMsg(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data?: { statusMessage?: string } }).data
    if (d?.statusMessage) return d.statusMessage
  }
  return null
}

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtAddedAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

const queued = computed(() => queue.value.filter(r => r.status === 'queued'))
const enqueued = computed(() => queue.value.filter(r => r.status === 'enqueued_spotify'))

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }
  const stored = window.sessionStorage.getItem(TOKEN_KEY)
  if (stored) {
    token.value = stored
  }
  void refresh()
  pollTimer = setInterval(() => {
    void refresh()
  }, POLL_MS)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div class="w-full max-w-2xl mx-auto space-y-6">
        <header class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium">
            <UIcon
              name="i-lucide-headphones"
              class="w-4 h-4"
            />
            DJ console
          </div>
          <h1 class="mt-3 font-[family-name:Bebas_Neue,sans-serif] text-4xl tracking-wider uppercase leading-tight">
            Jukebox
          </h1>
          <p class="mt-1 text-sm text-gray-400">
            Skip the current track or remove anything sketchy. Worker keeps Spotify in sync.
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
              Unlock console
            </UButton>
          </form>
        </div>

        <template v-else>
          <!-- Now playing -->
          <div class="rounded-3xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="text-[10px] font-bold uppercase tracking-widest text-primary-300/80">
                Now playing
              </div>
              <button
                class="text-[11px] text-gray-400 hover:text-primary-300"
                @click="clearToken"
              >
                Sign out
              </button>
            </div>
            <template v-if="nowPlaying?.track_id">
              <div class="flex items-center gap-3 sm:gap-4">
                <img
                  v-if="nowPlaying.album_image"
                  :src="nowPlaying.album_image"
                  :alt="`${nowPlaying.track_name} album art`"
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg shadow-black/40 shrink-0"
                >
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-white truncate">
                    {{ nowPlaying.track_name }}
                  </div>
                  <div class="text-sm text-gray-400 truncate">
                    {{ nowPlaying.artist }}
                  </div>
                  <div class="mt-1 text-[11px] text-gray-500">
                    {{ fmtTime(nowPlaying.progress_ms) }} / {{ fmtTime(nowPlaying.duration_ms) }}
                    · {{ nowPlaying.is_playing ? 'playing' : 'paused' }}
                    <span v-if="nowPlaying.device_name">· {{ nowPlaying.device_name }}</span>
                  </div>
                </div>
                <UButton
                  color="neutral"
                  icon="i-lucide-skip-forward"
                  :loading="acting === 'skip'"
                  class="rounded-xl font-semibold shrink-0"
                  @click="skipNow"
                >
                  Skip
                </UButton>
              </div>
            </template>
            <template v-else>
              <div class="text-sm text-gray-400">
                No active track. Pick a playlist on Spotify to wake the jukebox.
              </div>
            </template>
          </div>

          <!-- Locked-in (already sent to Spotify) -->
          <div
            v-if="enqueued.length > 0"
            class="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5"
          >
            <div class="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80 mb-2">
              Locked in (Spotify can't reorder)
            </div>
            <ul class="divide-y divide-emerald-500/10">
              <li
                v-for="row in enqueued"
                :key="row.id"
                class="flex items-center gap-3 py-2"
              >
                <img
                  v-if="row.album_image"
                  :src="row.album_image"
                  :alt="`${row.track_name} album art`"
                  class="w-10 h-10 rounded-lg object-cover shrink-0"
                >
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-semibold text-white truncate">
                    {{ row.track_name }}
                  </div>
                  <div class="text-xs text-gray-400 truncate">
                    {{ row.artist }}
                  </div>
                </div>
                <span class="shrink-0 text-xs font-bold text-gray-300">{{ row.votes }} votes</span>
              </li>
            </ul>
          </div>

          <!-- Up next -->
          <div class="rounded-3xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Up next ({{ queued.length }})
              </div>
              <span class="text-[11px] text-gray-500">votes desc · added asc</span>
            </div>
            <ul
              v-if="queued.length > 0"
              class="divide-y divide-gray-800/80"
            >
              <li
                v-for="(row, i) in queued"
                :key="row.id"
                class="flex items-center gap-3 py-2"
              >
                <span class="w-6 text-center shrink-0 text-xs font-bold text-gray-500">{{ i + 1 }}</span>
                <img
                  v-if="row.album_image"
                  :src="row.album_image"
                  :alt="`${row.track_name} album art`"
                  class="w-12 h-12 rounded-lg object-cover shrink-0"
                >
                <div
                  v-else
                  class="w-12 h-12 rounded-lg bg-gray-800 shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-white truncate">
                    {{ row.track_name }}
                  </div>
                  <div class="text-xs text-gray-400 truncate">
                    {{ row.artist }} · added {{ fmtAddedAgo(row.first_added_at) }} · {{ fmtTime(row.duration_ms) }}
                  </div>
                </div>
                <span class="shrink-0 inline-flex items-center gap-1 rounded-full border border-gray-700 px-2 py-1 text-xs font-bold">
                  <UIcon
                    name="i-lucide-arrow-up"
                    class="w-3.5 h-3.5"
                  />
                  {{ row.votes }}
                </span>
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  size="sm"
                  :loading="acting === row.id"
                  class="shrink-0"
                  @click="removeRow(row)"
                />
              </li>
            </ul>
            <div
              v-else
              class="text-sm text-gray-500 py-4 text-center"
            >
              Nothing in the queue yet.
            </div>
          </div>

          <div class="text-center text-[11px] text-gray-500">
            Spotify OAuth bootstrap: hit
            <code class="text-gray-300">/api/admin/jukebox/spotify/login?token=…</code> once,
            then run the worker on your home server.
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

      <transition
        enter-active-class="transition duration-200"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="flash"
          class="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[92%] px-4 py-2 rounded-full text-sm font-semibold backdrop-blur shadow-xl border"
          :class="flash.kind === 'ok'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            : flash.kind === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-gray-900/80 border-gray-700 text-gray-200'"
        >
          {{ flash.message }}
        </div>
      </transition>
    </section>
  </div>
</template>
