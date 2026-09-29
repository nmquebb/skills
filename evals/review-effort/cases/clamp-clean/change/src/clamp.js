/** `value` limited to the inclusive range `min..max`. */
export function clamp(value, min, max) {
  if ([value, min, max].some(Number.isNaN)) {
    throw new RangeError("clamp arguments must not be NaN")
  }

  if (min > max) {
    throw new RangeError(`min ${min} is greater than max ${max}`)
  }

  return Math.min(Math.max(value, min), max)
}
