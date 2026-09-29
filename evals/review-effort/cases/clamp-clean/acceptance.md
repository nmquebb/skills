Add `clamp(value, min, max)` for quantity inputs. Callers pass numbers. It returns `value` limited
to the inclusive range `min..max`. A `NaN` argument, or a `min` greater than `max`, throws a
`RangeError`.
