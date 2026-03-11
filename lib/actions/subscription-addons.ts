'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from '@/lib/actions/utils'
import { isDemoMode } from '@/lib/demo/utils'
import type { BusinessSubscriptionAddon } from '@/types/subscription-addons'
import { SUBSCRIPTION_ADDONS } from '@/lib/subscription-addons/definitions'

/**
 * Get all available subscription add-ons
 */
export async function getSubscriptionAddons() {
  return SUBSCRIPTION_ADDONS
}

/**
 * Get active subscription add-ons for a business
 */
export async function getBusinessSubscriptionAddons(businessId?: string): Promise<BusinessSubscriptionAddon[]> {
  // Check if in demo mode
  if (await isDemoMode()) {
    // Return mock active addons for demo mode
    // Show mileage tracker as active (trial) to demonstrate the feature
    const { MOCK_BUSINESS } = await import('@/lib/demo/mock-data')
    const targetBusinessId = businessId || MOCK_BUSINESS.id

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    return [
      {
        id: 'demo-addon-mileage',
        business_id: targetBusinessId,
        addon_key: 'mileage_tracker',
        stripe_subscription_item_id: null,
        status: 'trial',
        started_at: new Date().toISOString(),
        canceled_at: null,
        trial_ends_at: trialEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as BusinessSubscriptionAddon[]
  }

  const supabase = await createClient()
  const targetBusinessId = businessId || await getBusinessId()

  const { data, error } = await supabase
    .from('business_subscription_addons')
    .select('*')
    .eq('business_id', targetBusinessId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching business subscription add-ons:', error)
    return []
  }

  return (data || []) as BusinessSubscriptionAddon[]
}

/**
 * Whether the current user should see AI Auto Lead / Auto Follow-Up in the UI.
 * True for admin emails or when the business has the ai_auto_lead add-on.
 * Use this in layout and sequences page so admins always see the feature.
 */
export async function hasAIAutoLeadAccess(): Promise<boolean> {
  if (await isDemoMode()) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const { isAdminEmail } = await import('@/lib/permissions')
    if (isAdminEmail(user.email)) return true
  }
  return hasSubscriptionAddon('ai_auto_lead')
}

/**
 * Check if a business has a specific subscription add-on
 * Includes support for trials - checks if trial is still active
 * Admin users automatically have access to all add-ons
 * Also checks business.features array if it exists
 * In demo mode, returns true for all add-ons to show full feature set
 */
export async function hasSubscriptionAddon(
  addonKey: string,
  businessId?: string
): Promise<boolean> {
  // In demo mode, allow all subscription add-ons
  if (await isDemoMode()) {
    return true
  }

  const supabase = await createClient()
  const targetBusinessId = businessId || await getBusinessId()

  // Check if user is an admin - admins get access to all add-ons
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const { isAdminEmail } = await import('@/lib/permissions')
    if (isAdminEmail(user.email)) {
      return true
    }
  }

  // First check business.features array if it exists
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('features')
      .eq('id', targetBusinessId)
      .single()

    if (business?.features && Array.isArray(business.features)) {
      // Check if addonKey or addonId is in features array
      // Support both formats: 'ai_photo_analysis' (key) and 'ai_photo_analysis' (id)
      if (business.features.includes(addonKey)) {
        return true
      }
    }
  } catch (error) {
    // Features column may not exist, continue to check subscription table
    console.log('Could not check business.features (column may not exist)')
  }

  // Get the addon record (could be active or trial)
  const { data, error } = await supabase
    .from('business_subscription_addons')
    .select('id, status, trial_ends_at')
    .eq('business_id', targetBusinessId)
    .eq('addon_key', addonKey)
    .in('status', ['active', 'trial'])
    .single()

  if (error || !data) {
    return false
  }

  // If it's a trial, check if it's still valid
  if (data.status === 'trial') {
    const now = new Date()
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null

    // If trial has expired, automatically cancel it
    if (!trialEndsAt || trialEndsAt < now) {
      // Auto-expire the trial
      await supabase
        .from('business_subscription_addons')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', targetBusinessId)
        .eq('addon_key', addonKey)
        .eq('status', 'trial')

      return false
    }

    // Trial is still active
    return true
  }

  // Status is 'active'
  return true
}

/**
 * Check if a business has a specific subscription addon by addon_id
 * Maps addon_id to addon_key and checks both business.features and subscription table
 */
export async function hasSubscriptionAddonById(
  addonId: string,
  businessId: string
): Promise<boolean> {
  // Map addon_id to addon_key
  const addonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
  return hasSubscriptionAddon(addonKey, businessId)
}

/**
 * Get subscription add-on by key for a business
 */
export async function getBusinessSubscriptionAddon(
  addonKey: string,
  businessId?: string
): Promise<BusinessSubscriptionAddon | null> {
  const supabase = await createClient()
  const targetBusinessId = businessId || await getBusinessId()

  const { data, error } = await supabase
    .from('business_subscription_addons')
    .select('*')
    .eq('business_id', targetBusinessId)
    .eq('addon_key', addonKey)
    .single()

  if (error || !data) {
    return null
  }

  return data as BusinessSubscriptionAddon
}

/**
 * Create a subscription add-on record (called after Stripe checkout completes)
 */
export async function createSubscriptionAddon(
  businessId: string,
  addonKey: string,
  stripeSubscriptionItemId: string
): Promise<BusinessSubscriptionAddon> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_subscription_addons')
    .insert({
      business_id: businessId,
      addon_key: addonKey,
      stripe_subscription_item_id: stripeSubscriptionItemId,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as BusinessSubscriptionAddon
}

/**
 * Update subscription add-on status
 */
export async function updateSubscriptionAddonStatus(
  businessId: string,
  addonKey: string,
  status: 'active' | 'canceled' | 'past_due' | 'trial',
  canceledAt?: string
): Promise<void> {
  const supabase = await createClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'canceled' && canceledAt) {
    updateData.canceled_at = canceledAt
  }

  const { error } = await supabase
    .from('business_subscription_addons')
    .update(updateData)
    .eq('business_id', businessId)
    .eq('addon_key', addonKey)

  if (error) throw error
}

/**
 * Cancel a subscription add-on
 */
export async function cancelSubscriptionAddon(
  addonKey: string,
  businessId?: string
): Promise<void> {
  const supabase = await createClient()
  const targetBusinessId = businessId || await getBusinessId()

  const { error } = await supabase
    .from('business_subscription_addons')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', targetBusinessId)
    .eq('addon_key', addonKey)

  if (error) throw error
}

/**
 * Get all active addons for a business from business.features array
 * Returns array of addon IDs
 */
export async function getActiveAddons(businessId: string): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('features')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return []
    }

    return business.features || []
  } catch (error) {
    // Features column may not exist
    return []
  }
}

/**
 * Get all addon subscriptions with details
 * Alias for getBusinessSubscriptionAddons for consistency
 */
export async function getAddonSubscriptions(businessId: string) {
  return getBusinessSubscriptionAddons(businessId)
}
