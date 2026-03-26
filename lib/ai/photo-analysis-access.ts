import type { SupabaseClient } from '@supabase/supabase-js'
import { getTierFromBusiness, isAdminEmail } from '@/lib/permissions'

/** Fields needed for tier + feature checks (service-role reads). */
export type BusinessRowForPhotoAnalysis = {
  id: string
  owner_id?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  subscription_ends_at?: string | null
  billing_plan?: string | null
  features?: unknown
}

/**
 * Same rules as {@link hasAIPhotoAnalysis} in permissions, but uses a service-role
 * client so public booking pages and anonymous API routes can evaluate access.
 */
export async function checkAIPhotoAnalysisAccessWithServiceRole(
  business: BusinessRowForPhotoAnalysis,
  supabaseService: SupabaseClient
): Promise<boolean> {
  if (business.owner_id) {
    try {
      const { data: owner } = await supabaseService.auth.admin.getUserById(business.owner_id)
      if (owner?.user?.email && isAdminEmail(owner.user.email)) return true
    } catch {
      // ignore admin lookup failures
    }
  }

  const features = business.features
  if (features && Array.isArray(features) && features.includes('ai_photo_analysis')) {
    return true
  }

  const tier = getTierFromBusiness(business, null)
  if (tier === 'pro' || tier === 'fleet') return true

  const { data: addon } = await supabaseService
    .from('business_subscription_addons')
    .select('id, status, trial_ends_at')
    .eq('business_id', business.id)
    .eq('addon_key', 'ai_photo_analysis')
    .in('status', ['active', 'trial'])
    .maybeSingle()

  if (!addon) return false
  if (addon.status === 'trial') {
    const trialEndsAt = addon.trial_ends_at ? new Date(addon.trial_ends_at) : null
    return !!(trialEndsAt && trialEndsAt >= new Date())
  }
  return true
}

export async function loadBusinessAndCheckAIPhotoAnalysisAccess(
  supabaseService: SupabaseClient,
  businessId: string
): Promise<boolean> {
  const { data: business, error } = await supabaseService
    .from('businesses')
    .select('id, owner_id, subscription_plan, subscription_status, subscription_ends_at, billing_plan, features')
    .eq('id', businessId)
    .single()

  if (error || !business) return false
  return checkAIPhotoAnalysisAccessWithServiceRole(business, supabaseService)
}
