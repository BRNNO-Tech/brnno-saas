/**
 * Flat-rate tax stored per invoice row.
 * tax_rate is a decimal (e.g. 0.0825 = 8.25%); tax_amount is currency.
 */
export interface InvoiceTaxColumns {
  tax_rate: number | null
  tax_amount: number | null
}
