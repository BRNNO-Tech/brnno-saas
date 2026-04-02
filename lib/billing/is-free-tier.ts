/**
 * True for intentional Free tier (and legacy rows with no billing_plan).
 * Used to skip subscription/trial-expiry blocking — Free users keep full Free access.
 */
export function isFreeBillingTier(billingPlan: string | null | undefined): boolean {
  if (billingPlan == null || billingPlan === '') return true
  return billingPlan.toLowerCase() === 'free'
}
