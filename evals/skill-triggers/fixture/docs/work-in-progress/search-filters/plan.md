# Search filters: Plan

Status: approved 2026-09-24.

## Outcome

Customers filter the catalog by price range and category from the search page; filters persist in
the URL.

## Slices

1. Filter parsing and URL serialization in `src/filters.js`, with tests.
2. Catalog query applies filters.
3. Search page controls.
