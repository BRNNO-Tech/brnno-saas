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
  setupFee?: number // Optional one-time setup fee
  stripeMonthlyPriceId?: string // From Stripe environment variables
  stripeYearlyPriceId?: string
  stripeSetupFeePriceId?: string // Optional setup fee price ID
  availableForTiers: ('starter' | 'pro' | 'fleet')[]
  featureFlag: string // For permission checking
  requiresSetup?: boolean // Whether addon requires additional setup after purchase
  features?: string[] // List of features for marketing
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
