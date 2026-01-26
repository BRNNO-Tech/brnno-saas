// Reviews feature temporarily disabled - file not currently in use
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import { getBusiness } from './business'

export async function createReviewRequest(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, review_automation_enabled, review_delay_hours, google_review_link')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('No business found. Please complete your business setup in Settings.')
  }
  if (!business.review_automation_enabled) return // Skip if disabled

  // Get job with client info
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(id, name, email, phone)
    `)
    .eq('id', jobId)
    .single()

  if (!job || !job.client) return // Skip if no client

  // Calculate send time
  const sendAt = new Date()
  sendAt.setHours(sendAt.getHours() + (business.review_delay_hours || 24))

  // Create review request
  const { error } = await supabase
    .from('review_requests')
    .insert({
      business_id: business.id,
      job_id: jobId,
      client_id: job.client.id,
      send_at: sendAt.toISOString(),
      review_link: business.google_review_link,
      customer_name: job.client.name,
      customer_email: job.client.email,
      customer_phone: job.client.phone,
      status: 'pending'
    })

  if (error) throw error
}

export async function getReviewRequests() {
  const { isDemoMode } = await import('@/lib/demo/utils')

  if (await isDemoMode()) {
    // Return mock review requests for demo
    const { MOCK_JOBS, MOCK_CLIENTS } = await import('@/lib/demo/mock-data')
    const completedJobs = MOCK_JOBS.filter(j => j.status === 'completed').slice(0, 3)

    return completedJobs.map((job, index) => {
      const client = MOCK_CLIENTS.find(c => c.id === job.client_id) || MOCK_CLIENTS[0]
      const sendAt = new Date(job.completed_at || job.created_at)
      sendAt.setHours(sendAt.getHours() + 24)

      return {
        id: `demo-review-${index + 1}`,
        business_id: 'demo-business-id',
        job_id: job.id,
        client_id: client.id,
        send_at: sendAt.toISOString(),
        sent_at: index === 0 ? sendAt.toISOString() : null, // First one is sent
        customer_name: client.name,
        customer_email: client.email,
        customer_phone: client.phone,
        review_link: 'https://g.page/r/example-review-link',
        status: index === 0 ? 'sent' : index === 1 ? 'completed' : 'pending',
        created_at: job.completed_at || job.created_at,
        job: {
          title: job.title,
        },
      }
    })
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: requests, error } = await supabase
    .from('review_requests')
    .select(`
      *,
      job:jobs(title)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return requests || []
}

export async function updateReviewRequestStatus(id: string, status: 'sent' | 'completed' | 'failed') {
  const supabase = await createClient()

  const updates: any = { status }
  if (status === 'sent') {
    updates.sent_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('review_requests')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/reviews')
}

export async function deleteReviewRequest(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('review_requests')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/reviews')
}

export async function updateReviewSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const settings = {
    review_automation_enabled: formData.get('review_automation_enabled') === 'true',
    review_delay_hours: parseInt(formData.get('review_delay_hours') as string) || 24,
    google_review_link: formData.get('google_review_link') as string || null,
  }

  const { error } = await supabase
    .from('businesses')
    .update(settings)
    .eq('owner_id', user.id)

  if (error) throw error

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/reviews')
}

export async function getReviewStats() {
  const { isDemoMode } = await import('@/lib/demo/utils')

  if (await isDemoMode()) {
    return {
      avgRating: 4.8,
      totalReviews: 126,
      requestsSent: 184,
      pendingRequests: 3,
      channels: "SMS + Email",
      delay: "2 hours after job completion",
      platform: "Google",
    }
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get all review requests
  const { data: allRequests } = await supabase
    .from('review_requests')
    .select('status')
    .eq('business_id', businessId)

  const requestsSent = allRequests?.filter(r => r.status === 'sent' || r.status === 'completed').length || 0
  const pendingRequests = allRequests?.filter(r => r.status === 'pending').length || 0

  // Get business settings
  const { data: business } = await supabase
    .from('businesses')
    .select('review_automation_enabled, review_delay_hours, google_review_link')
    .eq('id', businessId)
    .single()

  const delayHours = business?.review_delay_hours || 24
  const delayText = delayHours === 1 ? '1 hour' : `${delayHours} hours`
  const delay = `${delayText} after job completion`

  // For now, we don't have actual reviews stored, so return 0
  // In the future, you could integrate with Google Reviews API or store reviews
  return {
    avgRating: 0, // Would come from actual reviews
    totalReviews: 0, // Would come from actual reviews
    requestsSent,
    pendingRequests,
    channels: "SMS + Email", // Could be configurable
    delay,
    platform: business?.google_review_link ? "Google" : "Not configured",
  }
}

export async function getBusinessReviewSettings() {
  const { isDemoMode } = await import('@/lib/demo/utils')

  if (await isDemoMode()) {
    return {
      review_automation_enabled: true,
      review_delay_hours: 2,
      google_review_link: 'https://g.page/r/example-review-link',
    }
  }

  try {
    const business = await getBusiness()
    // Type assertion for properties that may not be in the base type
    const businessWithFields = business as any
    return {
      review_automation_enabled: businessWithFields?.review_automation_enabled || false,
      review_delay_hours: businessWithFields?.review_delay_hours || 24,
      google_review_link: businessWithFields?.google_review_link || null,
    }
  } catch (error) {
    return {
      review_automation_enabled: false,
      review_delay_hours: 24,
      google_review_link: null,
    }
  }
}

