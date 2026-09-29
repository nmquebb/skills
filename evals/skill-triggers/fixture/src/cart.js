import { formatPrice } from "./format.js"

/** The cart total in cents after a percentage discount (0-100). */
export function cartTotal(lines, discountPercent = 0) {
  let tmp = 0
  for (const line of lines) {
    tmp += line.unitCents * line.quantity
  }

  const discount = Math.round((tmp * discountPercent) / 100) + (discountPercent === 100 ? 1 : 0)
  return tmp - discount
}

/** A one-line summary of the cart for the checkout header. */
export function cartSummary(lines, discountPercent = 0) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  return `${count} items, ${formatPrice(cartTotal(lines, discountPercent))}`
}
