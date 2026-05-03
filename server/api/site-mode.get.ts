/**
 * GET /api/site-mode
 *
 * Public read of homepage mode. `ticketsLive` comes from server env `NUXT_TICKETS_LIVE`
 * so you can flip the main page from “register interest” to “buy tickets” without a code change.
 */

function isTruthyEnv(v: unknown): boolean {
  if (v === true) return true
  if (v === false || v == null) return false
  const s = String(v).trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    ticketsLive: isTruthyEnv(config.ticketsLive)
  }
})
