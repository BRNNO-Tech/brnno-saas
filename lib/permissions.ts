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
    'messaging',
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
    'messaging',
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

// Admin emails that bypass subscription requirements (code list)
const ADMIN_EMAILS_LIST = [
  'john@brnno.com',
  'adrian@brnno.com',
  'sam@brnno.com',
  'skylar@brnno.com',
  'austin@brnno.com',
  'brandon@brnno.com',
  'enoch@brnno.com',
] as const

// Helper to check if email is an admin email (list + env ADMIN_EMAILS / ADMIN_SIGNUP_EMAILS)
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  if (ADMIN_EMAILS_LIST.includes(lower as any)) return true
  const envList = process.env.ADMIN_EMAILS || process.env.ADMIN_SIGNUP_EMAILS || ''
  const envEmails = envList.split(/[\s,]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
  return envEmails.includes(lower)
}

// Helper to get tier from business
export function getTierFromBusiness(business: {
  subscription_plan?: string | null
  subscription_status?: string | null
  subscription_ends_at?: string | null
  billing_plan?: string | null
  owner_id?: string | null
}, userEmail?: string | null): Tier {
  // Admin email bypass - always return 'pro' for admin emails
  if (userEmail && isAdminEmail(userEmail)) {
    return 'pro'
  }

  const bill = (business.billing_plan || '').toLowerCase()

  // Pro entitlements: billing_plan is the source of truth (not subscription_plan)
  if (bill === 'pro') {
    return 'pro'
  }
  if (bill === 'fleet') {
    return 'fleet'
  }

  const status = business.subscription_status
  const isPaidActive = status === 'active'
  const isTrialing = status === 'trialing'
  const endsAt = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null
  const trialStillValid = !endsAt || endsAt > new Date()
  const sub = (business.subscription_plan || '').toLowerCase()

  // Legacy Stripe tiers (starter / fleet only — not used for Pro feature gating)
  if ((isPaidActive || (isTrialing && trialStillValid)) && sub === 'fleet') {
    return 'fleet'
  }
  if ((isPaidActive || (isTrialing && trialStillValid)) && sub === 'starter') {
    return 'starter'
  }

  if (bill === 'starter') {
    return 'starter'
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
 * Available on Pro and Fleet tiers, via subscription add-on, business.features, or owner admin.
 * When `business.id` is set, uses the same DB-backed rules as public booking (service role).
 */
export async function hasAIPhotoAnalysis(
  business: {
    subscription_plan?: string | null
    subscription_status?: string | null
    subscription_ends_at?: string | null
    billing_plan?: string | null
    id?: string
  },
  userEmail?: string | null
): Promise<boolean> {
  if (userEmail && isAdminEmail(userEmail)) {
    return true
  }

  if (business.id) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const { loadBusinessAndCheckAIPhotoAnalysisAccess } = await import('@/lib/ai/photo-analysis-access')
      const svc = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      return loadBusinessAndCheckAIPhotoAnalysisAccess(svc, business.id)
    }
  }

  const tier = getTierFromBusiness(business, userEmail)
  if (tier === 'pro' || tier === 'fleet') {
    return true
  }

  if (business.id) {
    return await hasSubscriptionAddon(business.id, 'ai_photo_analysis')
  }

  return false
}

// ── NEW: Module-based feature checks ─────────────────────────────────────

/**
 * Check if a business has a specific module active
 * Based on the new modules JSONB column
 */
export function hasModule(
  business: { modules?: Record<string, any> | null },
  moduleName: string
): boolean {
  const modules = business.modules
  if (!modules) return false

  if (moduleName === 'leadRecovery') {
    return modules.leadRecovery?.enabled === true
  }
  if (moduleName === 'leadRecoveryAi') {
    return modules.leadRecovery?.ai === true
  }
  return modules[moduleName] === true
}

/**
 * Check if a business is on Pro Plus plan
 */
export function isProPlan(
  business: { billing_plan?: string | null }
): boolean {
  return business.billing_plan === 'pro'
}

/**
 * Full access check — admin OR correct plan/module
 * Use this as the single gating function going forward
 */
export function canAccess(
  business: {
    modules?: Record<string, any> | null
    billing_plan?: string | null
    subscription_plan?: string | null
    subscription_status?: string | null
    subscription_ends_at?: string | null
  },
  userEmail: string | null | undefined,
  requirement:
    | 'pro'
    | 'messaging'
    | 'automations'
    | 'leadRecovery'
    | 'jobs'
    | 'quickQuote'
    | 'photos'
    | 'mileage'
    | 'inventory'
    | 'invoices'
    | 'teamManagement'
    | 'leadRecoveryAi'
    | 'aiAssistant'
    | 'marketing'
): boolean {
  // Admins always have access
  if (userEmail && isAdminEmail(userEmail)) return true

  if (requirement === 'pro' || requirement === 'messaging' || requirement === 'automations') {
    return isProPlan(business)
  }

  if (requirement === 'aiAssistant') {
    if (!isProPlan(business)) {
      const tier = getTierFromBusiness(business, userEmail)
      if (tier !== 'fleet') return false
    }
    return hasModule(business, 'aiAssistant')
  }

  if (requirement === 'marketing') {
    return hasModule(business, 'marketing')
  }

  return hasModule(business, requirement)
}
