import assert from "node:assert/strict"
import { test } from "node:test"
import { groupBy } from "../src/group-by.js"

const orders = [
  { id: 1, status: "paid" },
  { id: 2, status: "open" },
  { id: 3, status: "paid" },
  { id: 4, status: "void" },
]

test("groups items by key in first-seen order", () => {
  const groups = groupBy(orders, (order) => order.status)
  assert.deepEqual([...groups.keys()], ["paid", "open", "void"])
  assert.deepEqual(
    groups.get("paid").map((order) => order.id),
    [1, 3],
  )
})

test("uses SameValueZero keys", () => {
  const groups = groupBy([Number.NaN, Number.NaN, 0, -0], (value) => value)
  assert.equal(groups.size, 2)
  assert.equal(groups.get(Number.NaN).length, 2)
  assert.equal(groups.get(0).length, 2)
})

test("returns an empty map for no items", () => {
  assert.equal(groupBy([], () => "x").size, 0)
})
