export const TIER_PERMISSIONS = {
  starter: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
  ],
  pro: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
    'full_automation',
    'advanced_quotes',
    'advanced_invoices',
    'reports',
    'custom_service_menus',
    'team_management',
    'lead_recovery_dashboard',
    'export_pdf',
    'basic_auto_assignment',
  ],
  fleet: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
    'full_automation',
    'advanced_quotes',
    'advanced_invoices',
    'reports',
    'custom_service_menus',
    'team_management',
    'lead_recovery_dashboard',
    'export_pdf',
    'earnings_tracking',
    'priority_support',
    'api_access',
    'basic_auto_assignment',
    'advanced_auto_assignment',
  ],
} as const

export type Tier = keyof typeof TIER_PERMISSIONS | null

export function hasFeature(tier: Tier, feature: string): boolean {
  if (!tier) return false
  return TIER_PERMISSIONS[tier]?.includes(feature as any) ?? false
}

export function getMaxTeamSize(tier: Tier): number {
  switch (tier) {
    case 'starter': return 1
    case 'pro': return 3
    case 'fleet': return 5
    default: return 0
  }
}

export function getMaxLeads(tier: Tier): number {
  switch (tier) {
    case 'starter': return 20  // Limited to 20 leads
    case 'pro': return -1      // Unlimited
    case 'fleet': return -1     // Unlimited
    default: return 0
  }
}

// Admin emails that bypass subscription requirements
const ADMIN_EMAILS = [
  'john@brnno.com',
  'adrian@brnno.com',
  'sam@brnno.com',
  'skylar@brnno.com',
  'austin@brnno.com',
  'brandon@brnno.com',
] as const

// Helper to check if email is an admin email
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

// Helper to get tier from business
export function getTierFromBusiness(business: { 
  subscription_plan?: string | null
  subscription_status?: string | null
  subscription_ends_at?: string | null
  owner_id?: string | null
}, userEmail?: string | null): Tier {
  // Admin email bypass - always return 'pro' for admin emails
  if (userEmail && isAdminEmail(userEmail)) {
    return 'pro'
  }

  const status = business.subscription_status
  const isPaidActive = status === 'active'
  const isTrialing = status === 'trialing'
  const endsAt = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null
  const trialStillValid = !endsAt || endsAt > new Date()

  // Active paid subscription: use plan as-is
  if (isPaidActive && business.subscription_plan) {
    const plan = business.subscription_plan.toLowerCase()
    return (plan === 'starter' || plan === 'pro' || plan === 'fleet') ? plan : null
  }

  // Trialing: only grant tier if trial end date is in the future (or not set)
  if (isTrialing && trialStillValid) {
    const plan = (business.subscription_plan || 'starter').toLowerCase()
    return (plan === 'starter' || plan === 'pro' || plan === 'fleet') ? plan : 'starter'
  }

  return null
}

/**
 * Check if a business has a specific subscription add-on
 * This is async because it needs to query the database
 */
export async function hasSubscriptionAddon(
  businessId: string,
  addonKey: string
): Promise<boolean> {
  try {
    const { hasSubscriptionAddon: checkAddon } = await import('@/lib/actions/subscription-addons')
    return await checkAddon(addonKey, businessId)
  } catch (error) {
    console.error('Error checking subscription add-on:', error)
    return false
  }
}

/**
 * Check if business has AI photo analysis feature
 * Available on Pro, Ultimate, and Fleet tiers, or via subscription add-on
 */
export async function hasAIPhotoAnalysis(
  business: { 
    subscription_plan?: string | null
    subscription_status?: string | null
    id?: string
  },
  userEmail?: string | null
): Promise<boolean> {
  // Admin emails always have access
  if (userEmail && isAdminEmail(userEmail)) {
    return true
  }

  const tier = getTierFromBusiness(business, userEmail)
  
  // Pro, Ultimate, and Fleet tiers have AI photo analysis
  if (tier === 'pro' || tier === 'fleet') {
    return true
  }

  // Check for subscription add-on
  if (business.id) {
    return await hasSubscriptionAddon(business.id, 'ai_photo_analysis')
  }

  return false
}
