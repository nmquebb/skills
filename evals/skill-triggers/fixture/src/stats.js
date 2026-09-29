/** The arithmetic mean of `values`, or null for none. */
export function mean(values) {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}
