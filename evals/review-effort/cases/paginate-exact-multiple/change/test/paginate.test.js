import assert from "node:assert/strict"
import { test } from "node:test"
import { paginate } from "../src/paginate.js"

const items = [0, 1, 2, 3, 4, 5, 6]

test("returns the requested page and whether another follows", () => {
  assert.deepEqual(paginate(items, { page: 1, pageSize: 3 }), {
    items: [0, 1, 2],
    page: 1,
    totalPages: 3,
    hasNext: true,
  })
  assert.deepEqual(paginate(items, { page: 3, pageSize: 3 }), {
    items: [6],
    page: 3,
    totalPages: 3,
    hasNext: false,
  })
})

test("defaults to the first page of 20", () => {
  assert.equal(paginate(items).items.length, 7)
  assert.equal(paginate(items).hasNext, false)
})

test("rejects pages and sizes out of range", () => {
  assert.throws(() => paginate(items, { page: 4, pageSize: 3 }), RangeError)
  assert.throws(() => paginate(items, { page: 0, pageSize: 3 }), RangeError)
  assert.throws(() => paginate(items, { pageSize: 0 }), RangeError)
})
