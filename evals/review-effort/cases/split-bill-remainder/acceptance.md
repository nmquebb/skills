Add `splitBill(totalCents, people)` for shared orders. It returns one integer share per person.
The shares sum exactly to `totalCents`, no two shares differ by more than one cent, and the
leftover cents go to the first people in order. A negative or non-integer `totalCents`, or a
`people` count that is not a positive integer, throws a `RangeError`.
