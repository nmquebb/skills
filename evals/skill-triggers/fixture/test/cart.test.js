import assert from "node:assert/strict"
import { test } from "node:test"
import { cartSummary, cartTotal } from "../src/cart.js"

const lines = [
  { unitCents: 250, quantity: 2 },
  { unitCents: 1000, quantity: 1 },
]

test("totals lines and applies a discount", () => {
  assert.equal(cartTotal(lines), 1500)
  assert.equal(cartTotal(lines, 10), 1350)
})

test("summarizes the cart", () => {
  assert.equal(cartSummary(lines), "3 items, $15.00")
})
