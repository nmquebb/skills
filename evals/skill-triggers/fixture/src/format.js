/** A display price such as "$12.34" for integer cents. */
export function formatPrice(cents) {
  const sign = cents < 0 ? "-" : ""
  const absolute = Math.abs(cents)
  return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`
}
