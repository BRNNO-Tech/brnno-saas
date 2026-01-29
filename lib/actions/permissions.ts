'use server'

import { getBusiness } from './business'
import { createClient } from '@/lib/supabase/server'
import { hasFeature, getTierFromBusiness, getMaxTeamSize, getMaxLeads, type Tier } from '@/lib/permissions'

export async function checkFeature(feature: string): Promise<boolean> {
  // Check if in demo mode - allow all features in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    // In demo mode, allow all features (demo uses pro tier)
    return true
  }

  const business = await getBusiness()
  if (!business) return false
  
  // Get user email for admin bypass check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email || null
  
  const tier = getTierFromBusiness(business, userEmail)
  return hasFeature(tier, feature)
}

export async function getCurrentTier(): Promise<Tier> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const business = await getBusiness()
  if (!business) return null

  // Cast: getBusiness() return type may omit subscription_ends_at (Supabase generated types); runtime has it
  const biz = business as Parameters<typeof getTierFromBusiness>[0]
  return getTierFromBusiness(biz, user?.email ?? null)
}

export async function getMaxTeamSizeForCurrentBusiness(): Promise<number> {
  const business = await getBusiness()
  if (!business) return 0
  
  // Get user email for admin bypass check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email || null
  
  const tier = getTierFromBusiness(business, userEmail)
  return getMaxTeamSize(tier)
}

export async function getMaxLeadsForCurrentBusiness(): Promise<number> {
  // Check if in demo mode - return unlimited for demo (pro tier)
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return -1 // Unlimited
  }

  const business = await getBusiness()
  if (!business) return 0
  
  // Get user email for admin bypass check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email || null
  
  const tier = getTierFromBusiness(business, userEmail)
  return getMaxLeads(tier)
}

export async function canAddMoreLeads(): Promise<{ canAdd: boolean; currentCount: number; maxLeads: number }> {
  // Check if in demo mode - return unlimited for demo (pro tier)
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return { canAdd: true, currentCount: 0, maxLeads: -1 }
  }

  const business = await getBusiness()
  if (!business) return { canAdd: false, currentCount: 0, maxLeads: 0 }
  
  // Get user email for admin bypass check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { canAdd: false, currentCount: 0, maxLeads: 0 }
  
  const userEmail = user.email || null
  const tier = getTierFromBusiness(business, userEmail)
  const maxLeads = getMaxLeads(tier)
  
  // Unlimited for Pro and Fleet
  if (maxLeads === -1) {
    return { canAdd: true, currentCount: 0, maxLeads: -1 }
  }
  
  // Count current leads
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
  
  const currentCount = count || 0
  const canAdd = currentCount < maxLeads
  
  return { canAdd, currentCount, maxLeads }
}

export async function canAccessTeamManagement(): Promise<boolean> {
  return checkFeature('team_management')
}

export async function canViewReports(): Promise<boolean> {
  return checkFeature('reports')
}

export async function canExportPDF(): Promise<boolean> {
  return checkFeature('export_pdf')
}

export async function canUseAdvancedQuotes(): Promise<boolean> {
  return checkFeature('advanced_quotes')
}

export async function canUseLeadRecoveryDashboard(): Promise<boolean> {
  return checkFeature('lead_recovery_dashboard')
}

export async function canUseFullAutomation(): Promise<boolean> {
  return checkFeature('full_automation')
}

export async function canUseAutoAssignment(): Promise<boolean> {
  return checkFeature('basic_auto_assignment')
}

export async function canUseAdvancedAutoAssignment(): Promise<boolean> {
  return checkFeature('advanced_auto_assignment')
}
