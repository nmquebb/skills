const UNIT_MS = { h: 3_600_000, m: 60_000, s: 1_000 }

/** Milliseconds in a duration such as "1h30m" or "45s". */
export function parseDuration(text) {
  const match = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(String(text).trim())
  if (!match) {
    throw new TypeError(`invalid duration: ${text}`)
  }

  const [, hours = 0, minutes = 0, seconds = 0] = match
  return hours * UNIT_MS.h + minutes * UNIT_MS.m + seconds * UNIT_MS.s
}
