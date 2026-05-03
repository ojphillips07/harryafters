/**
 * Tiny in-memory token-bucket rate limiter.
 *
 * Per-process state: this is "best effort" on serverless (each warm instance has
 * its own bucket). For the jukebox traffic profile (a few hundred guests at a
 * single party) it's plenty; we'd swap to Supabase / Redis if we needed strict
 * cross-instance limits.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Epoch ms when the bucket resets. */
  resetAt: number
}

/**
 * Allow `max` hits per `windowMs` window for `key`.
 * Returns `allowed: false` when the limit is hit.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, fresh)
    return { allowed: true, remaining: max - 1, resetAt: fresh.resetAt }
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client IP for rate-limit keys (not for security decisions). */
export function getClientIp(event: import('h3').H3Event): string {
  const fwd = (getRequestHeader(event, 'x-forwarded-for') ?? '').split(',')[0]?.trim()
  if (fwd) return fwd
  const real = getRequestHeader(event, 'x-real-ip')
  if (real) return real
  return 'unknown'
}
