'use server'

import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/utils'

/**
 * Check if business has SMS credits remaining
 */
export async function hasSMSCredits(businessId: string): Promise<boolean> {
    if (await isDemoMode()) return true
    const supabase = await createClient()

    const { data: business } = await supabase
        .from('businesses')
        .select('sms_credits_remaining, sms_credits_reset_at')
        .eq('id', businessId)
        .single()

    if (!business) return false

    // Check if credits need to be reset (monthly)
    const resetAt = business.sms_credits_reset_at ? new Date(business.sms_credits_reset_at) : null
    const now = new Date()

    if (resetAt && now > resetAt) {
        // Reset credits to monthly limit
        await resetSMSCredits(businessId)
        return true
    }

    return (business.sms_credits_remaining || 0) > 0
}

/**
 * Get remaining SMS credits for a business
 */
export async function getSMSCredits(businessId: string): Promise<{
    remaining: number
    limit: number
    resetAt: string | null
}> {
    if (await isDemoMode()) return { remaining: 500, limit: 500, resetAt: null }
    const supabase = await createClient()

    const { data: business } = await supabase
        .from('businesses')
        .select('sms_credits_remaining, sms_credits_monthly_limit, sms_credits_reset_at')
        .eq('id', businessId)
        .single()

    if (!business) {
        return { remaining: 0, limit: 500, resetAt: null }
    }

    // Check if credits need to be reset
    const resetAt = business.sms_credits_reset_at ? new Date(business.sms_credits_reset_at) : null
    const now = new Date()

    if (resetAt && now > resetAt) {
        await resetSMSCredits(businessId)
        return {
            remaining: business.sms_credits_monthly_limit || 500,
            limit: business.sms_credits_monthly_limit || 500,
            resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
        }
    }

    return {
        remaining: business.sms_credits_remaining || 0,
        limit: business.sms_credits_monthly_limit || 500,
        resetAt: business.sms_credits_reset_at
    }
}

/**
 * Decrement SMS credits when sending a message
 */
export async function decrementSMSCredits(businessId: string, count: number = 1): Promise<boolean> {
    if (await isDemoMode()) return true
    const supabase = await createClient()

    // Check if reset is needed first
    const { data: business } = await supabase
        .from('businesses')
        .select('sms_credits_remaining, sms_credits_reset_at, sms_credits_monthly_limit')
        .eq('id', businessId)
        .single()

    if (!business) return false

    const resetAt = business.sms_credits_reset_at ? new Date(business.sms_credits_reset_at) : null
    const now = new Date()

    // Reset if needed
    if (resetAt && now > resetAt) {
        await resetSMSCredits(businessId)
    }

    // Decrement credits
    const { error } = await supabase
        .from('businesses')
        .update({
            sms_credits_remaining: Math.max(0, (business.sms_credits_remaining || 500) - count)
        })
        .eq('id', businessId)
        .gte('sms_credits_remaining', count) // Only decrement if enough credits

    return !error
}

/**
 * Reset SMS credits to monthly limit (called monthly)
 */
async function resetSMSCredits(businessId: string): Promise<void> {
    const supabase = await createClient()

    const { data: business } = await supabase
        .from('businesses')
        .select('sms_credits_monthly_limit')
        .eq('id', businessId)
        .single()

    const monthlyLimit = business?.sms_credits_monthly_limit || 500

    // Reset credits to monthly limit and set next reset date
    const nextResetDate = new Date()
    nextResetDate.setMonth(nextResetDate.getMonth() + 1)
    nextResetDate.setDate(1) // First day of next month
    nextResetDate.setHours(0, 0, 0, 0)

    await supabase
        .from('businesses')
        .update({
            sms_credits_remaining: monthlyLimit,
            sms_credits_reset_at: nextResetDate.toISOString()
        })
        .eq('id', businessId)
}

/**
 * Initialize SMS credits for a new AI Auto Lead subscription
 */
export async function initializeSMSCredits(businessId: string, monthlyLimit: number = 500): Promise<void> {
    if (await isDemoMode()) return
    const supabase = await createClient()

    const nextResetDate = new Date()
    nextResetDate.setMonth(nextResetDate.getMonth() + 1)
    nextResetDate.setDate(1)
    nextResetDate.setHours(0, 0, 0, 0)

    await supabase
        .from('businesses')
        .update({
            sms_credits_remaining: monthlyLimit,
            sms_credits_monthly_limit: monthlyLimit,
            sms_credits_reset_at: nextResetDate.toISOString()
        })
        .eq('id', businessId)
}
