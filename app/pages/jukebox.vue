<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Jukebox — Harry Afters',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

interface SearchTrack {
  trackId: string
  trackUri: string
  trackName: string
  artist: string
  albumImage: string | null
  durationMs: number
  explicit: boolean
}

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

const DEVICE_KEY = 'ha-jukebox-device'
const POLL_MS = 3_000

const deviceId = ref('')
const search = ref('')
const searching = ref(false)
const searchResults = ref<SearchTrack[]>([])
const searchError = ref<string | null>(null)

const queue = ref<QueueRow[]>([])
const votedIds = ref<Set<string>>(new Set())
const nowPlaying = ref<NowPlayingRow | null>(null)

const adding = ref<Record<string, boolean>>({})
const flash = ref<{ message: string, kind: 'ok' | 'info' | 'error' } | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

let pollTimer: ReturnType<typeof setInterval> | null = null
let progressRaf: number | null = null

const progressMs = ref(0)
let progressBaselineMs = 0
let progressBaselineAt = 0

function flashMessage(message: string, kind: 'ok' | 'info' | 'error' = 'info') {
  flash.value = { message, kind }
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash.value = null
  }, 3_000)
}

function ensureDeviceId() {
  if (typeof window === 'undefined') return
  let id = window.localStorage.getItem(DEVICE_KEY) ?? ''
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
    window.localStorage.setItem(DEVICE_KEY, id)
  }
  deviceId.value = id
}

let searchSeq = 0
let searchDebounce: ReturnType<typeof setTimeout> | null = null

watch(search, (v) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  const q = v.trim()
  if (!q) {
    searchResults.value = []
    searchError.value = null
    searching.value = false
    return
  }
  searchDebounce = setTimeout(() => {
    void runSearch(q)
  }, 250)
})

async function runSearch(q: string) {
  const seq = ++searchSeq
  searching.value = true
  searchError.value = null
  try {
    const res = await $fetch<{ tracks: SearchTrack[] }>('/api/jukebox/search', { query: { q } })
    if (seq !== searchSeq) return
    searchResults.value = res.tracks ?? []
  } catch (err) {
    if (seq !== searchSeq) return
    let msg = 'Search failed.'
    if (err && typeof err === 'object' && 'data' in err) {
      const d = (err as { data?: { statusMessage?: string } }).data
      if (d?.statusMessage) msg = d.statusMessage
    }
    searchError.value = msg
  } finally {
    if (seq === searchSeq) searching.value = false
  }
}

async function addTrack(track: SearchTrack) {
  if (!deviceId.value) return
  if (adding.value[track.trackId]) return
  adding.value = { ...adding.value, [track.trackId]: true }
  try {
    const res = await $fetch<{ ok: boolean, alreadyVoted: boolean, row: QueueRow }>('/api/jukebox/queue', {
      method: 'POST',
      body: {
        trackId: track.trackId,
        trackUri: track.trackUri,
        trackName: track.trackName,
        artist: track.artist,
        albumImage: track.albumImage,
        durationMs: track.durationMs,
        deviceId: deviceId.value
      }
    })
    if (res.alreadyVoted) {
      flashMessage('Already on the list — votes locked from this device.', 'info')
    } else {
      const isNew = res.row.votes === 1
      flashMessage(
        isNew ? 'Added to the queue.' : 'Bumped — more votes, higher up the queue.',
        'ok'
      )
      mergeQueueRow(res.row)
      votedIds.value = new Set([...votedIds.value, res.row.id])
    }
  } catch (err) {
    let msg = 'Could not add to queue.'
    if (err && typeof err === 'object' && 'data' in err) {
      const d = (err as { data?: { statusMessage?: string } }).data
      if (d?.statusMessage) msg = d.statusMessage
    }
    flashMessage(msg, 'error')
  } finally {
    adding.value = { ...adding.value, [track.trackId]: false }
  }
}

async function voteUp(row: QueueRow) {
  if (!deviceId.value || votedIds.value.has(row.id)) return
  await addTrack({
    trackId: row.track_id,
    trackUri: row.track_uri,
    trackName: row.track_name,
    artist: row.artist,
    albumImage: row.album_image,
    durationMs: row.duration_ms,
    explicit: false
  })
}

function mergeQueueRow(row: QueueRow) {
  const idx = queue.value.findIndex(r => r.id === row.id)
  if (idx >= 0) queue.value.splice(idx, 1, row)
  else queue.value.push(row)
  queue.value = [...queue.value]
    .filter(r => ['queued', 'enqueued_spotify', 'now_playing'].includes(r.status))
    .sort((a, b) => (b.votes - a.votes) || (a.first_added_at < b.first_added_at ? -1 : 1))
}

async function refresh() {
  if (!deviceId.value) return
  try {
    const [q, np] = await Promise.all([
      $fetch<{ queue: QueueRow[], votedIds: string[] }>('/api/jukebox/queue', {
        query: { deviceId: deviceId.value }
      }),
      $fetch<{ nowPlaying: NowPlayingRow | null }>('/api/jukebox/now-playing')
    ])
    queue.value = q.queue ?? []
    votedIds.value = new Set(q.votedIds ?? [])
    setNowPlaying(np.nowPlaying)
  } catch {
    /* swallow polling errors so transient blips don't shout at the user */
  }
}

function setNowPlaying(np: NowPlayingRow | null) {
  nowPlaying.value = np
  if (np) {
    progressBaselineMs = np.progress_ms ?? 0
    progressBaselineAt = Date.now()
    progressMs.value = progressBaselineMs
  } else {
    progressBaselineMs = 0
    progressBaselineAt = 0
    progressMs.value = 0
  }
}

function tickProgress() {
  if (nowPlaying.value && nowPlaying.value.is_playing && nowPlaying.value.duration_ms > 0) {
    const elapsed = progressBaselineMs + (Date.now() - progressBaselineAt)
    progressMs.value = Math.min(elapsed, nowPlaying.value.duration_ms)
  }
  progressRaf = requestAnimationFrame(tickProgress)
}

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const npProgressPct = computed(() => {
  const np = nowPlaying.value
  if (!np || np.duration_ms <= 0) return 0
  return Math.max(0, Math.min(100, (progressMs.value / np.duration_ms) * 100))
})

const queuePosition = (row: QueueRow): number | null => {
  if (row.status !== 'queued') return null
  const queued = queue.value.filter(r => r.status === 'queued')
  const idx = queued.findIndex(r => r.id === row.id)
  return idx >= 0 ? idx + 1 : null
}

onMounted(() => {
  ensureDeviceId()
  void refresh()
  pollTimer = setInterval(() => {
    void refresh()
  }, POLL_MS)
  progressRaf = requestAnimationFrame(tickProgress)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (progressRaf !== null) cancelAnimationFrame(progressRaf)
  if (searchDebounce) clearTimeout(searchDebounce)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<template>
  <div class="relative min-h-screen overflow-clip bg-gray-950 text-gray-100">
    <div class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full" />

    <section class="relative isolate min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div class="w-full max-w-xl mx-auto space-y-6">
        <header class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium">
            <UIcon
              name="i-lucide-music-4"
              class="w-4 h-4"
            />
            Jukebox
          </div>
          <h1 class="mt-3 font-[family-name:Bebas_Neue,sans-serif] text-4xl tracking-wider uppercase leading-tight">
            Pick the music
          </h1>
          <p class="mt-1 text-sm text-gray-400">
            Search a song. If someone else picks the same one, it climbs the queue.
          </p>
        </header>

        <!-- Now playing -->
        <div class="rounded-3xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
          <div class="text-[10px] font-bold uppercase tracking-widest text-primary-300/80 mb-2">
            Now playing
          </div>
          <template v-if="nowPlaying?.track_id">
            <div class="flex items-center gap-3 sm:gap-4">
              <img
                v-if="nowPlaying.album_image"
                :src="nowPlaying.album_image"
                :alt="`${nowPlaying.track_name} album art`"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg shadow-black/40 shrink-0"
              >
              <div
                v-else
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-800 grid place-items-center shrink-0"
              >
                <UIcon
                  name="i-lucide-disc-3"
                  class="w-8 h-8 text-gray-600"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-white truncate">
                  {{ nowPlaying.track_name }}
                </div>
                <div class="text-sm text-gray-400 truncate">
                  {{ nowPlaying.artist }}
                </div>
                <div class="mt-2 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-[width] duration-200 ease-linear"
                    :style="{ width: `${npProgressPct}%` }"
                  />
                </div>
                <div class="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                  <span>{{ fmtTime(progressMs) }}</span>
                  <span>{{ fmtTime(nowPlaying.duration_ms) }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-3 text-sm text-gray-400">
              <UIcon
                name="i-lucide-disc-3"
                class="w-5 h-5 text-gray-600"
              />
              Nothing playing yet — drop a song below.
            </div>
          </template>
        </div>

        <!-- Search -->
        <div class="rounded-3xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5 space-y-3">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Search Spotify</label>
          <UInput
            v-model="search"
            placeholder="Song or artist…"
            size="lg"
            autocomplete="off"
            class="w-full"
            icon="i-lucide-search"
            :loading="searching"
          />
          <div
            v-if="searchError"
            class="text-sm text-red-400"
          >
            {{ searchError }}
          </div>
          <ul
            v-if="searchResults.length > 0"
            class="divide-y divide-gray-800/80"
          >
            <li
              v-for="t in searchResults"
              :key="t.trackId"
              class="flex items-center gap-3 py-2"
            >
              <img
                v-if="t.albumImage"
                :src="t.albumImage"
                :alt="`${t.trackName} album art`"
                class="w-12 h-12 rounded-lg object-cover shrink-0"
              >
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gray-800 grid place-items-center shrink-0"
              >
                <UIcon
                  name="i-lucide-music"
                  class="w-5 h-5 text-gray-600"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-white truncate flex items-center gap-1.5">
                  {{ t.trackName }}
                  <span
                    v-if="t.explicit"
                    class="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-gray-700 text-gray-300"
                  >E</span>
                </div>
                <div class="text-xs text-gray-400 truncate">
                  {{ t.artist }}
                </div>
              </div>
              <UButton
                color="primary"
                size="sm"
                :loading="!!adding[t.trackId]"
                class="rounded-xl font-semibold shrink-0"
                @click="addTrack(t)"
              >
                Add
              </UButton>
            </li>
          </ul>
          <div
            v-else-if="search.trim() && !searching"
            class="text-sm text-gray-500"
          >
            No matches.
          </div>
        </div>

        <!-- Queue -->
        <div class="rounded-3xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Up next
            </div>
            <div class="text-[11px] text-gray-500">
              {{ queue.filter(r => r.status === 'queued').length }} queued
            </div>
          </div>
          <ul
            v-if="queue.length > 0"
            class="divide-y divide-gray-800/80"
          >
            <li
              v-for="row in queue"
              :key="row.id"
              class="flex items-center gap-3 py-2"
              :class="row.status === 'now_playing' ? 'opacity-100' : ''"
            >
              <div class="w-7 text-center shrink-0">
                <span
                  v-if="row.status === 'now_playing'"
                  class="inline-flex items-center"
                >
                  <UIcon
                    name="i-lucide-volume-2"
                    class="w-4 h-4 text-primary-400"
                  />
                </span>
                <span
                  v-else-if="row.status === 'enqueued_spotify'"
                  class="text-[10px] uppercase tracking-widest text-emerald-300/80"
                >Lock</span>
                <span
                  v-else
                  class="text-xs font-bold text-gray-500"
                >{{ queuePosition(row) }}</span>
              </div>
              <img
                v-if="row.album_image"
                :src="row.album_image"
                :alt="`${row.track_name} album art`"
                class="w-12 h-12 rounded-lg object-cover shrink-0"
              >
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gray-800 grid place-items-center shrink-0"
              >
                <UIcon
                  name="i-lucide-music"
                  class="w-5 h-5 text-gray-600"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-white truncate">
                  {{ row.track_name }}
                </div>
                <div class="text-xs text-gray-400 truncate">
                  {{ row.artist }}
                </div>
              </div>
              <button
                class="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-bold transition hover:border-primary-400/60 hover:text-primary-200 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="votedIds.has(row.id) || row.status !== 'queued'"
                @click="voteUp(row)"
              >
                <UIcon
                  v-if="votedIds.has(row.id)"
                  name="i-lucide-check"
                  class="w-4 h-4 text-emerald-400"
                />
                <UIcon
                  v-else
                  name="i-lucide-arrow-up"
                  class="w-4 h-4"
                />
                <span>{{ row.votes }}</span>
              </button>
            </li>
          </ul>
          <div
            v-else
            class="text-sm text-gray-500 py-4 text-center"
          >
            Queue is empty — be the first to add a tune.
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/"
            class="text-xs text-gray-500 hover:text-primary-300 transition-colors"
          >
            ← Back to the site
          </NuxtLink>
        </div>
      </div>

      <!-- Toast -->
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
