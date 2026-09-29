import assert from "node:assert/strict"
import { test } from "node:test"
import { parseDuration } from "../src/duration.js"

test("reads hours, minutes, and seconds", () => {
  assert.equal(parseDuration("1h30m"), 5_400_000)
  assert.equal(parseDuration("45s"), 45_000)
  assert.equal(parseDuration("2h"), 7_200_000)
  assert.equal(parseDuration("1h2m3s"), 3_723_000)
})

test("ignores surrounding whitespace", () => {
  assert.equal(parseDuration(" 90s "), 90_000)
})
