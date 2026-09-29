import assert from "node:assert/strict"
import { test } from "node:test"
import { retry } from "../src/retry.js"

test("returns the first successful result", async () => {
  let calls = 0
  const result = await retry(async () => {
    calls++
    if (calls < 2) {
      throw new Error("flaky")
    }

    return "ok"
  })
  assert.equal(result, "ok")
  assert.equal(calls, 2)
})

test("rethrows a non-retryable error at once", async () => {
  let calls = 0
  const fatal = new Error("fatal")
  await assert.rejects(
    retry(
      async () => {
        calls++
        throw fatal
      },
      { isRetryable: () => false },
    ),
    fatal,
  )
  assert.equal(calls, 1)
})

test("rethrows the last error when every attempt fails", async () => {
  await assert.rejects(
    retry(async (attempt) => {
      throw new Error(`failure ${attempt}`)
    }),
    /failure/,
  )
})
