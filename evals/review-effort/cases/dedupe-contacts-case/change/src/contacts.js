/** The first contact for each email address, in the original order. */
export function dedupeContacts(contacts) {
  const seen = new Set()
  const unique = []
  for (const contact of contacts) {
    const key = contact.email.trim()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(contact)
    }
  }

  return unique
}
