import assert from "node:assert/strict"
import { test } from "node:test"
import { dedupeContacts } from "../src/contacts.js"

test("keeps the first contact for each address in order", () => {
  const contacts = [
    { name: "Ana", email: "ana@example.com" },
    { name: "Ben", email: "ben@example.com" },
    { name: "Ana again", email: "ana@example.com" },
  ]
  assert.deepEqual(
    dedupeContacts(contacts).map((contact) => contact.name),
    ["Ana", "Ben"],
  )
})

test("ignores surrounding whitespace", () => {
  const contacts = [
    { name: "Cy", email: " cy@example.com" },
    { name: "Cy copy", email: "cy@example.com  " },
  ]
  assert.deepEqual(
    dedupeContacts(contacts).map((contact) => contact.name),
    ["Cy"],
  )
})
