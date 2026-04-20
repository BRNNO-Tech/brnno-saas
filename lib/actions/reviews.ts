'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getBusiness } from './business'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type Review = {
  id: string
  business_id: string
  review_request_id: string | null
  customer_name: string | null
  customer_email: string | null
  rating: number
  comment: string | null
  created_at: string
}

/**
 * Returns a Supabase client with the service role key. Bypasses RLS.
 * Use for public/unauthenticated flows (e.g. subdomain profile).
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Fetch reviews for a business (public listing, e.g. subdomain profile).
 * Uses the service role client so unauthenticated visitors can see reviews;
 * RLS only allows business owners, which would block the public profile.
 * Ordered by created_at desc.
 */
export async function getReviewsForBusiness(businessId: string): Promise<Review[]> {
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('id, business_id, review_request_id, customer_name, customer_email, rating, comment, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReviewsForBusiness error:', error)
    return []
  }
  return (data ?? []) as Review[]
}

/**
 * Load review request by id (token) for the public review form.
 * Returns request + business (subdomain, name) for the page.
 */
export async function getReviewRequestByToken(token: string): Promise<{
  id: string
  business_id: string
  customer_name: string | null
  customer_email: string | null
  subdomain: string
  business_name: string
  primary_color: string
  google_review_link: string | null
} | null> {
  const supabase = getSupabaseClient()
  const { data: req, error: reqError } = await supabase
    .from('review_requests')
    .select('id, business_id, customer_name, customer_email')
    .eq('id', token)
    .maybeSingle()

  if (reqError || !req) return null

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, subdomain')
    .eq('id', req.business_id)
    .single()

  if (bizError || !business) return null

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('primary_color, google_review_link')
    .eq('business_id', req.business_id)
    .maybeSingle()

  const primary_color = (profile as any)?.primary_color ?? '#3B82F6'
  const google_review_link = (profile as any)?.google_review_link ?? (business as any)?.google_review_link ?? null

  return {
    id: req.id,
    business_id: req.business_id,
    customer_name: req.customer_name ?? null,
    customer_email: req.customer_email ?? null,
    subdomain: business.subdomain ?? '',
    business_name: business.name ?? '',
    primary_color,
    google_review_link,
  }
}

/**
 * Submit an internal review and mark the review request as completed.
 */
export async function submitReview(params: {
  reviewRequestId: string
  businessId: string
  customerName: string | null
  customerEmail: string | null
  rating: number
  comment: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { reviewRequestId, businessId, customerName, customerEmail, rating, comment } = params
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Invalid rating' }
  }

  const supabase = getSupabaseClient()

  const { error: insertError } = await supabase.from('reviews').insert({
    business_id: businessId,
    review_request_id: reviewRequestId,
    customer_name: customerName || null,
    customer_email: customerEmail || null,
    rating,
    comment: comment?.trim() || null,
  })

  if (insertError) {
    console.error('submitReview insert error:', insertError)
    return { success: false, error: insertError.message }
  }

  await supabase
    .from('review_requests')
    .update({ status: 'completed' })
    .eq('id', reviewRequestId)

  return { success: true }
}

/**
 * Create a pending review request when a job is marked completed.
 * Schedules the request to be sent (e.g. 2 hours later) by the cron.
 */
export async function createReviewRequest(jobId: string): Promise<void> {
  const business = await getBusiness()
  if (!business) return

  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!canAccess(business, user?.email ?? null, 'reviews')) {
    return
  }

  const supabase = getSupabaseClient()
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, business_id, title, client:clients(name, phone, email)')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .maybeSingle()

  if (jobError || !job) return

  const client = (job as any).client as { name?: string; phone?: string; email?: string } | null
  const sendAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now

  await supabase.from('review_requests').insert({
    business_id: job.business_id,
    customer_name: client?.name ?? '',
    customer_email: client?.email ?? null,
    customer_phone: client?.phone ?? null,
    status: 'pending',
    send_at: sendAt,
  })
}

export type ReviewRequestRow = {
  id: string
  business_id: string
  status: string
  send_at: string
  sent_at: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  review_link: string | null
  created_at: string
  job: { title: string } | null
}

/**
 * Fetch review requests for the current user's business (dashboard).
 */
export async function getReviewRequests(): Promise<ReviewRequestRow[]> {
  const business = await getBusiness()
  if (!business) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('review_requests')
    .select('id, business_id, status, send_at, sent_at, customer_name, customer_email, customer_phone, review_link, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReviewRequests error:', error)
    return []
  }

  const rows = (data ?? []) as Omit<ReviewRequestRow, 'job'>[]
  return rows.map((r) => ({ ...r, customer_name: r.customer_name ?? '', job: null }))
}

export type ReviewStats = {
  avgRating: number
  totalReviews: number
  requestsSent: number
  pendingRequests: number
  channels: string
  delay: string
  platform: string
  sentThisMonth?: number
  showUsageLimit?: boolean
  monthlyLimit?: number
}

/**
 * Aggregate stats for the reviews dashboard.
 */
export async function getReviewStats(): Promise<ReviewStats> {
  const business = await getBusiness()
  if (!business) {
    return {
      avgRating: 0,
      totalReviews: 0,
      requestsSent: 0,
      pendingRequests: 0,
      channels: 'SMS + Email',
      delay: '2 hours after job completion',
      platform: 'Google',
      sentThisMonth: 0,
      showUsageLimit: false,
      monthlyLimit: 100,
    }
  }

  const supabase = getSupabaseClient()
  const businessId = business.id
  const modules = (business as any)?.modules as Record<string, unknown> | null | undefined
  const hasReviewsModule = modules?.reviews === true
  const monthlyLimit = hasReviewsModule ? 500 : 0
  const showUsageLimit = hasReviewsModule

  const startOfMonth = (() => {
    const d = new Date()
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  })()

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyDaysAgoIso = ninetyDaysAgo.toISOString()

  const [
    { data: reviewsLast90 },
    { count: totalReviewsCount },
    { count: sentCount },
    { count: pendingCount },
    { count: sentThisMonthCount },
  ] = await Promise.all([
    supabase.from('reviews').select('rating').eq('business_id', businessId).gte('created_at', ninetyDaysAgoIso),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('review_requests').select('id', { count: 'exact', head: true }).eq('business_id', businessId).in('status', ['sent', 'completed']),
    supabase.from('review_requests').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'pending'),
    supabase.from('review_requests').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'sent').gte('sent_at', startOfMonth),
  ])

  const reviews90 = (reviewsLast90 ?? []) as { rating: number }[]
  const avgRating = reviews90.length > 0 ? reviews90.reduce((s, r) => s + r.rating, 0) / reviews90.length : 0

  return {
    avgRating,
    totalReviews: totalReviewsCount ?? 0,
    requestsSent: sentCount ?? 0,
    pendingRequests: pendingCount ?? 0,
    channels: 'SMS + Email',
    delay: '2 hours after job completion',
    platform: 'Google',
    sentThisMonth: sentThisMonthCount ?? 0,
    showUsageLimit,
    monthlyLimit,
  }
}

export type BusinessReviewSettings = {
  google_review_link: string | null
}

/**
 * Load review-related settings for the current business (profile + business).
 */
export async function getBusinessReviewSettings(): Promise<BusinessReviewSettings> {
  const business = await getBusiness()
  if (!business) return { google_review_link: null }

  const supabase = getSupabaseClient()
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('google_review_link')
    .eq('business_id', business.id)
    .maybeSingle()

  const google_review_link = (profile as any)?.google_review_link ?? (business as any)?.google_review_link ?? null
  return { google_review_link }
}

/**
 * Delete a review request. Only allowed for the request's business owner.
 */
export async function deleteReviewRequest(id: string): Promise<{ success: boolean; error?: string }> {
  const business = await getBusiness()
  if (!business) return { success: false, error: 'Not authorized' }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('review_requests').delete().eq('id', id).eq('business_id', business.id)

  if (error) {
    console.error('deleteReviewRequest error:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Update a review request's status (e.g. mark as sent). Only allowed for the request's business owner.
 */
export async function updateReviewRequestStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  const business = await getBusiness()
  if (!business) return { success: false, error: 'Not authorized' }

  const supabase = getSupabaseClient()
  const payload: { status: string; sent_at?: string } = { status }
  if (status === 'sent') payload.sent_at = new Date().toISOString()

  const { error } = await supabase.from('review_requests').update(payload).eq('id', id).eq('business_id', business.id)

  if (error) {
    console.error('updateReviewRequestStatus error:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}
