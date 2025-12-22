'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createReviewRequest } from './reviews'
import { getBusinessId } from './utils'

export async function getJobs() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(name, phone, email)
    `)
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: true })
  
  if (error) throw error
  return jobs || []
}

export async function addJob(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const jobData = {
    business_id: businessId,
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: formData.get('scheduled_date') as string || null,
    estimated_duration: formData.get('estimated_duration') ? parseInt(formData.get('estimated_duration') as string) : null,
    estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
    status: 'scheduled',
    priority: formData.get('priority') as string || 'medium',
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip: formData.get('zip') as string || null,
    is_mobile_service: formData.get('is_mobile_service') === 'true',
    client_notes: formData.get('client_notes') as string || null,
    internal_notes: formData.get('internal_notes') as string || null,
  }
  
  const { error } = await supabase
    .from('jobs')
    .insert(jobData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/jobs')
}

export async function updateJobStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id)
  
  if (error) throw error
  
  // Trigger review request when job is completed
  if (status === 'completed') {
    try {
      await createReviewRequest(id)
    } catch (error) {
      console.error('Failed to create review request:', error)
      // Don't fail the job update if review request fails
    }
  }
  
  revalidatePath('/dashboard/jobs')
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const jobData = {
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: formData.get('scheduled_date') as string || null,
    estimated_duration: formData.get('estimated_duration') ? parseInt(formData.get('estimated_duration') as string) : null,
    estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
    priority: formData.get('priority') as string || 'medium',
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip: formData.get('zip') as string || null,
    is_mobile_service: formData.get('is_mobile_service') === 'true',
    client_notes: formData.get('client_notes') as string || null,
    internal_notes: formData.get('internal_notes') as string || null,
  }
  
  const { error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/jobs')
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/jobs')
}

