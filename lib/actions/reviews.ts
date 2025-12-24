'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

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

