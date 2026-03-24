export type CancellationPolicy = {
  enabled: boolean
  hold_amount: number
  rules: {
    hours_before: number
    charge_amount: number
  }[]
  noshow_charge: number
}
