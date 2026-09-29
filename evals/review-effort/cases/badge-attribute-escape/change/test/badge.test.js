import assert from "node:assert/strict"
import { test } from "node:test"
import { escapeHtml, renderBadge } from "../src/badge.js"

test("renders the label with the title defaulting to it", () => {
  assert.equal(renderBadge({ label: "New" }), "<span class='badge' title='New'>New</span>")
  assert.equal(renderBadge({ label: "New", title: "Added today" }), "<span class='badge' title='Added today'>New</span>")
})

test("escapes markup in user input", () => {
  assert.equal(escapeHtml('<b>"x" & y</b>'), "&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;")
  assert.equal(
    renderBadge({ label: "<script>alert(1)</script>" }),
    "<span class='badge' title='&lt;script&gt;alert(1)&lt;/script&gt;'>&lt;script&gt;alert(1)&lt;/script&gt;</span>",
  )
})
