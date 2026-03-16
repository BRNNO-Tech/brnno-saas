import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo/utils'

// ── Plan limits ────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  jobs: {
    free: 50,
    module: 300, // jobs module (Pro plan)
  },
  photos: {
    free: 0,
    module: 1000,
  },
  photoStorageGb: {
    free: 0,
    module: 50,
  },
} as const

// ── Period helper ──────────────────────────────────────────────────────────

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── Increment usage ────────────────────────────────────────────────────────

export async function incrementUsage(
  businessId: string,
  metric: 'jobs' | 'photos',
  amount = 1,
  supabaseInstance?: SupabaseClient
): Promise<void> {
  if (await isDemoMode()) return
  const client = supabaseInstance ?? (await createClient())
  const period = getCurrentPeriod()

  const { error } = await client.rpc('increment_usage', {
    p_business_id: businessId,
    p_metric: metric,
    p_period: period,
    p_amount: amount,
  })

  if (error) {
    console.error(`Failed to increment usage (${metric}):`, error)
    // Non-fatal — don't throw, job creation should still succeed
  }
}

export async function decrementUsage(
  businessId: string,
  metric: 'jobs' | 'photos',
  amount = 1,
  supabaseInstance?: SupabaseClient
): Promise<void> {
  if (await isDemoMode()) return
  const client = supabaseInstance ?? (await createClient())
  const period = getCurrentPeriod()

  const { error } = await client.rpc('decrement_usage', {
    p_business_id: businessId,
    p_metric: metric,
    p_period: period,
    p_amount: amount,
  })

  if (error) {
    console.error(`Failed to decrement usage (${metric}):`, error)
  }
}

// ── Get current usage ──────────────────────────────────────────────────────

export async function getUsage(
  businessId: string,
  metric: 'jobs' | 'photos',
  period?: string,
  supabaseInstance?: SupabaseClient
): Promise<number> {
  if (await isDemoMode()) return metric === 'jobs' ? 12 : 0
  const client = supabaseInstance ?? (await createClient())
  const targetPeriod = period || getCurrentPeriod()

  const { data, error } = await client
    .from('usage_tracking')
    .select('count')
    .eq('business_id', businessId)
    .eq('metric', metric)
    .eq('period', targetPeriod)
    .single()

  if (error || !data) return 0
  return data.count
}

// ── Get usage summary for a business ───────────────────────────────────────

export type UsageSummary = {
  jobs: {
    count: number
    limit: number
    percent: number
    atWarning: boolean  // >= 80%
    atLimit: boolean    // >= 100%
    overLimit: boolean  // > 100%
    isUnlimited: boolean
  }
  photos: {
    count: number
    limit: number
    percent: number
    atWarning: boolean
    atLimit: boolean
    overLimit: boolean
    isUnlimited: boolean
    blocked: boolean // free plan - no photos at all
  }
}

export async function getUsageSummary(
  businessId: string,
  billingPlan: string,
  modules: Record<string, any> | null
): Promise<UsageSummary> {
  if (await isDemoMode()) {
    const jobCount = 12
    const photoCount = 24
    const jobLimit = billingPlan === 'pro' ? Infinity : 50
    const hasPhotosModule = modules?.photos === true
    const photoLimit = hasPhotosModule ? 1000 : 0
    return {
      jobs: { count: jobCount, limit: jobLimit, percent: jobLimit === Infinity ? 0 : 24, atWarning: false, atLimit: false, overLimit: false, isUnlimited: jobLimit === Infinity },
      photos: { count: photoCount, limit: photoLimit, percent: photoLimit === 0 ? 100 : 2, atWarning: false, atLimit: false, overLimit: false, isUnlimited: false, blocked: !hasPhotosModule },
    }
  }
  const period = getCurrentPeriod()
  const supabase = await createClient()

  const { data: usageRows } = await supabase
    .from('usage_tracking')
    .select('metric, count')
    .eq('business_id', businessId)
    .eq('period', period)
    .in('metric', ['jobs', 'photos'])

  const jobCount = usageRows?.find(r => r.metric === 'jobs')?.count ?? 0
  const photoCount = usageRows?.find(r => r.metric === 'photos')?.count ?? 0

  const isProPlan = billingPlan === 'pro'
  const hasPhotosModule = modules?.photos === true

  // Jobs: free = 50, pro = unlimited
  const jobLimit = isProPlan ? Infinity : PLAN_LIMITS.jobs.free
  const jobPercent = jobLimit === Infinity ? 0 : Math.round((jobCount / jobLimit) * 100)

  // Photos: free = blocked, module = 1000
  const photoLimit = hasPhotosModule ? PLAN_LIMITS.photos.module : PLAN_LIMITS.photos.free
  const photoPercent = photoLimit === 0 ? 100 : Math.round((photoCount / photoLimit) * 100)

  return {
    jobs: {
      count: jobCount,
      limit: jobLimit,
      percent: jobPercent,
      atWarning: jobLimit !== Infinity && jobPercent >= 80 && jobPercent < 100,
      atLimit: jobLimit !== Infinity && jobPercent >= 100,
      overLimit: jobLimit !== Infinity && jobCount > jobLimit,
      isUnlimited: jobLimit === Infinity,
    },
    photos: {
      count: photoCount,
      limit: photoLimit,
      percent: photoPercent,
      atWarning: hasPhotosModule && photoPercent >= 80 && photoPercent < 100,
      atLimit: hasPhotosModule && photoPercent >= 100,
      overLimit: hasPhotosModule && photoCount > photoLimit,
      isUnlimited: false,
      blocked: !hasPhotosModule,
    },
  }
}

// ── Check if job creation is allowed ──────────────────────────────────────

export async function canCreateJob(
  businessId: string,
  billingPlan: string,
  supabaseInstance?: SupabaseClient
): Promise<{ allowed: boolean; reason?: string; count: number; limit: number }> {
  if (await isDemoMode()) return { allowed: true, count: 12, limit: 50 }
  const isProPlan = billingPlan === 'pro'

  if (isProPlan) {
    return { allowed: true, count: 0, limit: Infinity }
  }

  const count = await getUsage(businessId, 'jobs', undefined, supabaseInstance)
  const limit = PLAN_LIMITS.jobs.free

  if (count >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly job limit of ${limit} on the Free plan. Upgrade to Pro for unlimited jobs.`,
      count,
      limit,
    }
  }

  return { allowed: true, count, limit }
}
