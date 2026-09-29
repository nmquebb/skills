import assert from "node:assert/strict"
import { test } from "node:test"
import { formatCents, toCents } from "../src/money.js"

test("toCents reads whole and decimal amounts", () => {
  assert.equal(toCents("12.34"), 1234)
  assert.equal(toCents("7"), 700)
  assert.equal(toCents("0.5"), 50)
  assert.throws(() => toCents("1.234"), TypeError)
  assert.throws(() => toCents("abc"), TypeError)
})

test("formatCents prints dollars and cents", () => {
  assert.equal(formatCents(1234), "$12.34")
  assert.equal(formatCents(5), "$0.05")
  assert.equal(formatCents(-250), "-$2.50")
  assert.throws(() => formatCents(1.5), TypeError)
})
