const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }

/** `text` with HTML's special characters escaped. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (character) => ESCAPES[character])
}

/** A status badge; `label` and `title` are user input. */
export function renderBadge({ label, title = label }) {
  return `<span class='badge' title='${escapeHtml(title)}'>${escapeHtml(label)}</span>`
}
