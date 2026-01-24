/**
 * Subscription add-on types
 * These are business-level recurring subscription features, separate from service add-ons
 */

export interface SubscriptionAddon {
  key: string // e.g., 'mileage_tracker'
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  stripeMonthlyPriceId?: string // From Stripe environment variables
  stripeYearlyPriceId?: string
  availableForTiers: ('starter' | 'pro' | 'fleet')[]
  featureFlag: string // For permission checking
}

export interface BusinessSubscriptionAddon {
  id: string
  business_id: string
  addon_key: string
  stripe_subscription_item_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trial'
  started_at: string
  canceled_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}
