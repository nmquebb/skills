Contact import deduplicates by email address with `dedupeContacts(contacts)`. Two addresses are
the same when they match ignoring letter case and surrounding whitespace. Keep the first contact
for each address, in the original order.
