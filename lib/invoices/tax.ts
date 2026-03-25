/** Round to 2 decimal places (currency). */
export function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100
}

export function parseTaxRate(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

/**
 * subtotalAfterDiscount: line total minus discount (pre-tax).
 * taxRateDecimal: business rate e.g. 0.0825 for 8.25%.
 */
export function computeTaxOnSubtotal(subtotalAfterDiscount: number, taxRateDecimal: number) {
  const sub = roundCurrency(Math.max(0, subtotalAfterDiscount))
  const rate = parseTaxRate(taxRateDecimal)
  if (rate === 0) {
    return { tax_rate: 0, tax_amount: 0, total: sub }
  }
  const tax_amount = roundCurrency(sub * rate)
  return { tax_rate: rate, tax_amount, total: roundCurrency(sub + tax_amount) }
}
