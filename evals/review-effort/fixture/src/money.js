/** Integer cents from a decimal amount such as "12.34" or "7". */
export function toCents(amount) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount).trim())
  if (!match) {
    throw new TypeError(`invalid amount: ${amount}`)
  }

  const [, whole, fraction = ""] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}

/** A display string such as "$12.34" for integer cents. */
export function formatCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`cents must be an integer: ${cents}`)
  }

  const sign = cents < 0 ? "-" : ""
  const absolute = Math.abs(cents)
  return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`
}
