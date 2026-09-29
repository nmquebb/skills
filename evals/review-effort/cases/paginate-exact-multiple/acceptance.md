Add `paginate(items, { page, pageSize })` for list screens. Pages are 1-based and `pageSize`
defaults to 20. It returns `{ items, page, totalPages, hasNext }`: `totalPages` is the number of
pages that contain items (0 for an empty list), and `hasNext` is true only when a later page
contains items. Page 1 of an empty list returns no items; any other page outside
`1..totalPages`, or a `pageSize` that is not a positive integer, throws a `RangeError`.
