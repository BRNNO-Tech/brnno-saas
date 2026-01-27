/**
 * Subscription Add-On Definitions
 * 
 * These are business-level recurring subscription features that can be added
 * to any subscription tier. They are separate from service add-ons that
 * customers select during booking.
 */

import type { SubscriptionAddon } from '@/types/subscription-addons'

export const SUBSCRIPTION_ADDONS: SubscriptionAddon[] = [
  {
    key: 'mileage_tracker',
    name: 'Mileage Tracker',
    description: 'Automatic mileage tracking for tax deductions with Google Maps integration, IRS deduction calculations, and CSV export',
    monthlyPrice: 9.99, // TODO: Set actual price
    yearlyPrice: 99.99, // TODO: Set actual price (typically 10x monthly)
    stripeMonthlyPriceId: process.env.STRIPE_MILEAGE_TRACKER_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_MILEAGE_TRACKER_YEARLY_PRICE_ID,
    availableForTiers: ['starter', 'pro', 'fleet'],
    featureFlag: 'mileage_tracker',
  },
  {
    key: 'ai_photo_analysis',
    name: 'AI Photo Analysis',
    description: 'AI-powered vehicle condition analysis from customer photos during booking. Automatically detects vehicle condition, issues, and suggests relevant add-ons.',
    monthlyPrice: 19.99, // TODO: Set actual price
    yearlyPrice: 199.99, // TODO: Set actual price (typically 10x monthly)
    stripeMonthlyPriceId: process.env.STRIPE_AI_PHOTO_ANALYSIS_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_AI_PHOTO_ANALYSIS_YEARLY_PRICE_ID,
    availableForTiers: ['starter', 'pro', 'fleet'],
    featureFlag: 'ai_photo_analysis',
  },
  {
    key: 'ai_auto_lead',
    name: 'AI Auto Lead',
    description: 'Full AI-powered lead automation with SMS conversations, auto-responses, and intelligent follow-ups. Includes your own business phone number and Twilio account.',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    setupFee: 20.00, // One-time setup fee for Twilio number and A2P registration
    stripeMonthlyPriceId: process.env.STRIPE_AI_AUTO_LEAD_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_AI_AUTO_LEAD_YEARLY_PRICE_ID,
    stripeSetupFeePriceId: process.env.STRIPE_AI_AUTO_LEAD_SETUP_FEE_PRICE_ID,
    availableForTiers: ['starter', 'pro', 'fleet'],
    featureFlag: 'ai_auto_lead',
    requiresSetup: true, // Requires business info and phone number setup
    features: [
      'AI-powered SMS conversations with leads',
      'Automatic lead responses 24/7',
      'Smart follow-up sequences',
      'Your own business phone number',
      'Dedicated Twilio subaccount',
      'A2P compliance & brand registration',
      'Unlimited SMS conversations',
      'Lead qualification automation'
    ]
  },
]

/**
 * Get subscription add-on by key
 */
export function getSubscriptionAddon(key: string): SubscriptionAddon | undefined {
  return SUBSCRIPTION_ADDONS.find(addon => addon.key === key)
}

/**
 * Get all subscription add-ons available for a specific tier
 */
export function getAvailableAddonsForTier(tier: 'starter' | 'pro' | 'fleet' | null): SubscriptionAddon[] {
  if (!tier) return []
  return SUBSCRIPTION_ADDONS.filter(addon => addon.availableForTiers.includes(tier))
}
