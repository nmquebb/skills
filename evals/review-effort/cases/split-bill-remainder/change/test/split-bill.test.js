import assert from "node:assert/strict"
import { test } from "node:test"
import { splitBill } from "../src/split-bill.js"

const sum = (shares) => shares.reduce((total, share) => total + share, 0)

test("splits evenly when the total divides", () => {
  assert.deepEqual(splitBill(1000, 4), [250, 250, 250, 250])
})

test("shares always add up to the total", () => {
  for (const [total, people] of [
    [1000, 3],
    [999, 7],
    [1, 1],
  ]) {
    const shares = splitBill(total, people)
    assert.equal(shares.length, people)
    assert.equal(sum(shares), total)
  }
})

test("rejects invalid input", () => {
  assert.throws(() => splitBill(-1, 2), RangeError)
  assert.throws(() => splitBill(10.5, 2), RangeError)
  assert.throws(() => splitBill(10, 0), RangeError)
})
