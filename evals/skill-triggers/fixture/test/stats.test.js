import assert from "node:assert/strict"
import { test } from "node:test"
import { mean } from "../src/stats.js"

test("averages values", () => {
  assert.equal(mean([1, 2, 3, 4]), 2.5)
  assert.equal(mean([]), null)
})
