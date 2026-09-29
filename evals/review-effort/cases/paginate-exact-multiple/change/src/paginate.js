/** One 1-based page of `items`, with the page count and whether a later page has items. */
export function paginate(items, { page = 1, pageSize = 20 } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive integer")
  }

  const totalPages = Math.floor(items.length / pageSize) + 1
  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    throw new RangeError(`page must be between 1 and ${totalPages}`)
  }

  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page,
    totalPages,
    hasNext: page < totalPages,
  }
}
