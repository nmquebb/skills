Add `groupBy(items, keyOf)` for order reports. It returns a `Map` from each key that `keyOf(item)`
returns to the items with that key. Keys keep the order in which they first appear, and each
group keeps the items' original order. Keys compare like `Map` keys (SameValueZero). An empty list
gives an empty `Map`.
