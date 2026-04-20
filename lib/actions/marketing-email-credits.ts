'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo/utils'

const DEFAULT_MONTHLY = 1000

async function resetMarketingEmailCreditsIfDue(
  businessId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: business } = await supabase
    .from('businesses')
    .select('marketing_email_credits_monthly_limit')
    .eq('id', businessId)
    .single()

  const monthlyLimit = business?.marketing_email_credits_monthly_limit ?? DEFAULT_MONTHLY
  const nextResetDate = new Date()
  nextResetDate.setMonth(nextResetDate.getMonth() + 1)
  nextResetDate.setDate(1)
  nextResetDate.setHours(0, 0, 0, 0)

  await supabase
    .from('businesses')
    .update({
      marketing_email_credits_remaining: monthlyLimit,
      marketing_email_credits_reset_at: nextResetDate.toISOString(),
    })
    .eq('id', businessId)
}

/**
 * Remaining marketing email credits after applying monthly reset if due.
 * Use with service-role Supabase from API / campaign send jobs.
 */
export async function getMarketingEmailCreditsBalance(
  businessId: string,
  supabase: SupabaseClient
): Promise<number> {
  if (await isDemoMode()) return 999999

  const { data: business } = await supabase
    .from('businesses')
    .select(
      'marketing_email_credits_remaining, marketing_email_credits_reset_at, marketing_email_credits_monthly_limit'
    )
    .eq('id', businessId)
    .single()

  if (!business) return 0

  const resetAt = business.marketing_email_credits_reset_at
    ? new Date(business.marketing_email_credits_reset_at)
    : null
  const now = new Date()
  if (resetAt && now > resetAt) {
    await resetMarketingEmailCreditsIfDue(businessId, supabase)
    const { data: after } = await supabase
      .from('businesses')
      .select('marketing_email_credits_remaining')
      .eq('id', businessId)
      .single()
    return Math.max(
      0,
      after?.marketing_email_credits_remaining ??
        business.marketing_email_credits_monthly_limit ??
        DEFAULT_MONTHLY
    )
  }

  const raw = business.marketing_email_credits_remaining
  if (raw == null) {
    const limit = business.marketing_email_credits_monthly_limit ?? DEFAULT_MONTHLY
    await supabase
      .from('businesses')
      .update({ marketing_email_credits_remaining: limit })
      .eq('id', businessId)
    return limit
  }

  return Math.max(0, raw)
}

/**
 * Atomically decrement marketing email credits; returns false if insufficient.
 */
export async function tryDecrementMarketingEmailCredits(
  businessId: string,
  count: number,
  supabase: SupabaseClient
): Promise<boolean> {
  if (await isDemoMode()) return true
  if (count <= 0) return true

  const { data: business } = await supabase
    .from('businesses')
    .select(
      'marketing_email_credits_remaining, marketing_email_credits_reset_at, marketing_email_credits_monthly_limit'
    )
    .eq('id', businessId)
    .single()

  if (!business) return false

  const resetAt = business.marketing_email_credits_reset_at
    ? new Date(business.marketing_email_credits_reset_at)
    : null
  const now = new Date()
  if (resetAt && now > resetAt) {
    await resetMarketingEmailCreditsIfDue(businessId, supabase)
    const { data: afterReset } = await supabase
      .from('businesses')
      .select('marketing_email_credits_remaining')
      .eq('id', businessId)
      .single()
    business.marketing_email_credits_remaining =
      afterReset?.marketing_email_credits_remaining ??
      business.marketing_email_credits_monthly_limit ??
      DEFAULT_MONTHLY
  }

  let previous = business.marketing_email_credits_remaining
  if (previous == null) {
    previous = business.marketing_email_credits_monthly_limit ?? DEFAULT_MONTHLY
  }
  const newRemaining = Math.max(0, previous - count)

  const { error } = await supabase
    .from('businesses')
    .update({ marketing_email_credits_remaining: newRemaining })
    .eq('id', businessId)
    .gte('marketing_email_credits_remaining', count)

  return !error
}
