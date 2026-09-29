import assert from "node:assert/strict"
import { test } from "node:test"
import { formatPrice } from "../src/format.js"

test("formats cents as dollars", () => {
  assert.equal(formatPrice(1234), "$12.34")
  assert.equal(formatPrice(5), "$0.05")
  assert.equal(formatPrice(-123), "-$1.23")
})
