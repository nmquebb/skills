import assert from "node:assert/strict"
import { test } from "node:test"
import { toCsvRow } from "../src/csv.js"

test("joins plain fields with commas", () => {
  assert.equal(toCsvRow(["A-100", "Widget", 3]), "A-100,Widget,3")
})

test("quotes fields with commas or quotes", () => {
  assert.equal(toCsvRow(["Smith, Jo", 'The "best"']), '"Smith, Jo","The ""best"""')
})

test("writes empty fields for missing values", () => {
  assert.equal(toCsvRow(["a", null, undefined, "b"]), "a,,,b")
})
