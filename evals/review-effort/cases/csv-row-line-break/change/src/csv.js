/** One CSV record, quoting the fields that need it. */
export function toCsvRow(fields) {
  return fields
    .map((field) => {
      const text = field === null || field === undefined ? "" : String(field)
      return /[",]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    })
    .join(",")
}
