/** A sliding-window limiter: `tryAcquire()` reports whether another call fits in the window. */
export function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const calls = []
  return function tryAcquire() {
    const current = now()
    while (calls.length > 0 && calls[0] < current - windowMs) {
      calls.shift()
    }

    if (calls.length >= limit) {
      return false
    }

    calls.push(current)
    return true
  }
}
