import assert from "node:assert/strict"
import { test } from "node:test"
import { createRateLimiter } from "../src/rate-limit.js"

function clock(...times) {
  return () => times.shift()
}

test("allows up to the limit within the window", () => {
  const tryAcquire = createRateLimiter({ limit: 2, windowMs: 1000, now: clock(0, 10, 20) })
  assert.equal(tryAcquire(), true)
  assert.equal(tryAcquire(), true)
  assert.equal(tryAcquire(), false)
})

test("allows calls again once old ones leave the window", () => {
  const tryAcquire = createRateLimiter({ limit: 2, windowMs: 1000, now: clock(0, 10, 20, 1500) })
  tryAcquire()
  tryAcquire()
  assert.equal(tryAcquire(), false)
  assert.equal(tryAcquire(), true)
})
