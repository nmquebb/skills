import assert from "node:assert/strict"
import { test } from "node:test"
import { clamp } from "../src/clamp.js"

test("keeps values inside the range", () => {
  assert.equal(clamp(5, 1, 10), 5)
  assert.equal(clamp(1, 1, 10), 1)
  assert.equal(clamp(10, 1, 10), 10)
})

test("limits values outside the range", () => {
  assert.equal(clamp(-3, 1, 10), 1)
  assert.equal(clamp(42, 1, 10), 10)
  assert.equal(clamp(7, 7, 7), 7)
})

test("rejects NaN and inverted ranges", () => {
  assert.throws(() => clamp(Number.NaN, 1, 10), RangeError)
  assert.throws(() => clamp(5, Number.NaN, 10), RangeError)
  assert.throws(() => clamp(5, 1, Number.NaN), RangeError)
  assert.throws(() => clamp(5, 10, 1), RangeError)
})
