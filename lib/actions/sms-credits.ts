'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/utils'

/**
 * Check if business has SMS credits remaining
 * @param supabaseOptional - When provided (e.g. from API route with service role), use it instead of createClient()
 */
export async function hasSMSCredits(businessId: string, supabaseOptional?: SupabaseClient): Promise<boolean> {
    if (await isDemoMode()) return true
    const supabase = supabaseOptional ?? (await createClient())

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
        await resetSMSCredits(businessId, supabase)
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
 * Sends low-credits warning at 50 and run-out notification at 0.
 * @param supabaseOptional - When provided (e.g. from API route with service role), use it instead of createClient()
 */
export async function decrementSMSCredits(businessId: string, count: number = 1, supabaseOptional?: SupabaseClient): Promise<boolean> {
    if (await isDemoMode()) return true
    const supabase = supabaseOptional ?? (await createClient())

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
        await resetSMSCredits(businessId, supabaseOptional)
        const { data: afterReset } = await supabase
            .from('businesses')
            .select('sms_credits_remaining')
            .eq('id', businessId)
            .single()
        business.sms_credits_remaining = afterReset?.sms_credits_remaining ?? business.sms_credits_monthly_limit ?? 500
    }

    const previousRemaining = business.sms_credits_remaining ?? 500
    const newRemaining = Math.max(0, previousRemaining - count)

    // Decrement credits
    const { error } = await supabase
        .from('businesses')
        .update({
            sms_credits_remaining: newRemaining
        })
        .eq('id', businessId)
        .gte('sms_credits_remaining', count) // Only decrement if enough credits

    if (error) return false

    // Low-credits warning: send once when remaining hits exactly 50
    if (newRemaining === 50) {
        await sendLowCreditsWarningEmail(businessId, 50, supabase)
    }
    // Run-out notification: when credits reach 0
    if (newRemaining === 0) {
        await sendCreditsRunOutEmail(businessId, supabase)
    }

    return true
}

async function sendLowCreditsWarningEmail(businessId: string, remaining: number, supabase: SupabaseClient): Promise<void> {
    const { data: biz } = await supabase.from('businesses').select('email, name, sender_name').eq('id', businessId).single()
    if (!biz?.email || !process.env.RESEND_API_KEY) return
    const { Resend } = await import('resend')
    const client = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = (biz as { sender_name?: string }).sender_name || biz.name || 'BRNNO'
    try {
        await client.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: biz.email,
            subject: 'Your SMS credits are running low',
            html: `<p>You have ${remaining} SMS credits left. Contact support to add more credits and keep your AI assistant and sequences running.</p>`,
        })
    } catch (e) {
        console.error('[sms-credits] Low credits warning email failed:', e)
    }
}

async function sendCreditsRunOutEmail(businessId: string, supabase: SupabaseClient): Promise<void> {
    const { data: biz } = await supabase.from('businesses').select('email, name, sender_name').eq('id', businessId).single()
    if (!biz?.email || !process.env.RESEND_API_KEY) return
    const { Resend } = await import('resend')
    const client = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = (biz as { sender_name?: string }).sender_name || biz.name || 'BRNNO'
    try {
        await client.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: biz.email,
            subject: 'Your SMS credits have run out',
            html: '<p>Your SMS credits have run out. SMS sending has been paused. Contact support to add more credits.</p>',
        })
    } catch (e) {
        console.error('[sms-credits] Credits run-out email failed:', e)
    }
}

/**
 * Reset SMS credits to monthly limit (called monthly)
 */
export async function resetSMSCredits(businessId: string, supabaseOptional?: SupabaseClient): Promise<void> {
    const supabase = supabaseOptional ?? (await createClient())

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

/**
 * SMS credits remaining after applying monthly reset if due.
 * Use with service-role Supabase inside campaign send so balance matches decrements.
 */
export async function getSMSCreditsBalance(
    businessId: string,
    supabase: SupabaseClient
): Promise<number> {
    if (await isDemoMode()) return 999999
    const { data: business } = await supabase
        .from('businesses')
        .select('sms_credits_remaining, sms_credits_reset_at, sms_credits_monthly_limit')
        .eq('id', businessId)
        .single()
    if (!business) return 0
    const resetAt = business.sms_credits_reset_at ? new Date(business.sms_credits_reset_at) : null
    const now = new Date()
    if (resetAt && now > resetAt) {
        await resetSMSCredits(businessId, supabase)
        const { data: after } = await supabase
            .from('businesses')
            .select('sms_credits_remaining')
            .eq('id', businessId)
            .single()
        return Math.max(
            0,
            after?.sms_credits_remaining ?? business.sms_credits_monthly_limit ?? 500
        )
    }
    return Math.max(0, business.sms_credits_remaining ?? 0)
}
