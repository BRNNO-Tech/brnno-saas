'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createReviewRequest } from './reviews'
import { createInvoiceFromJob } from './invoices'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockJobs } from '@/lib/demo/mock-data'

export async function getJobs() {
  if (await isDemoMode()) {
    return getMockJobs()
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Try to include mileage, but don't fail if table doesn't exist yet
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(name, phone, email),
      assignments:job_assignments(
        id,
        team_member:team_members!job_assignments_team_member_id_fkey(id, name, role)
      ),
      mileage_record:job_mileage(id, miles_driven, is_manual_override, from_address, from_city, from_state, from_zip)
    `)
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: true })

  // If error is about missing table/relation, try without mileage
  if (error && (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === 'PGRST116')) {
    const { data: jobsWithoutMileage, error: error2 } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients(name, phone, email),
        assignments:job_assignments(
          id,
          team_member:team_members!job_assignments_team_member_id_fkey(id, name, role)
        )
      `)
      .eq('business_id', businessId)
      .order('scheduled_date', { ascending: true })
    
    if (error2) {
      console.error('Error fetching jobs:', JSON.stringify(error2, null, 2))
      throw error2
    }
    return jobsWithoutMileage || []
  }

  if (error) {
    console.error('Error fetching jobs:', JSON.stringify(error, null, 2))
    throw error
  }

  // Add photo_count to each job (includes both booking and job photos)
  if (jobs && jobs.length > 0) {
    const { getJobPhotoCount } = await import('./unified-job-photos')
    const jobsWithPhotoCount = await Promise.all(
      jobs.map(async (job) => {
        try {
          const photoCount = await getJobPhotoCount(job.id)
          return { ...job, photo_count: photoCount }
        } catch (error) {
          console.error(`Error getting photo count for job ${job.id}:`, error)
          return { ...job, photo_count: 0 }
        }
      })
    )
    return jobsWithPhotoCount
  }

  return jobs || []
}

export async function addJob(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // The scheduled_date should already be in ISO format (UTC) from the client
  // The client-side code converts datetime-local to UTC before sending
  const scheduledDate = formData.get('scheduled_date') as string | null

  // Convert hours to minutes for storage
  const durationHours = formData.get('estimated_duration') ? parseFloat(formData.get('estimated_duration') as string) : null
  let durationMinutes = durationHours ? Math.round(durationHours * 60) : null

  // Get add-ons from form data and calculate additional duration
  const addonsJson = formData.get('addons') as string | null
  let selectedAddons: any[] = []
  let addonDuration = 0

  if (addonsJson) {
    try {
      selectedAddons = JSON.parse(addonsJson)
      
      // If add-ons are provided, fetch their durations and add to total
      if (selectedAddons.length > 0 && Array.isArray(selectedAddons)) {
        const addonIds = selectedAddons
          .map(a => typeof a === 'string' ? a : a.id)
          .filter(Boolean)
        
        if (addonIds.length > 0) {
          const { data: addons } = await supabase
            .from('service_addons')
            .select('id, duration_minutes')
            .in('id', addonIds)
            .eq('business_id', businessId)
          
          if (addons) {
            addonDuration = addons.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
          }
        }
      }
    } catch (error) {
      console.error('Error parsing add-ons:', error)
      // Continue without add-ons if parsing fails
    }
  }

  // Add add-on duration to base duration
  const totalDuration = (durationMinutes || 60) + addonDuration

  const jobData = {
    business_id: businessId,
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: scheduledDate,
    estimated_duration: totalDuration, // Base duration + add-on durations
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
    addons: selectedAddons.length > 0 ? selectedAddons : null, // Store add-ons in job record
  }

  const { error } = await supabase
    .from('jobs')
    .insert(jobData)

  if (error) {
    console.error('Error creating job:', JSON.stringify(error, null, 2))
    throw error
  }

  revalidatePath('/dashboard/jobs')
}

export async function updateJobStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify the job belongs to the user's business
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, business_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching job:', fetchError)
    throw new Error(`Job not found: ${fetchError.message}`)
  }

  if (!job) {
    throw new Error('Job not found')
  }

  if (job.business_id !== businessId) {
    throw new Error('Unauthorized: Job does not belong to your business')
  }

  // Build update object - only include completed_at if status is 'completed'
  const updateData: any = { status }
  if (status === 'completed') {
    // Only try to set completed_at if the column exists
    // If it doesn't exist, the update will still work without it
    try {
      updateData.completed_at = new Date().toISOString()
    } catch (e) {
      // Column might not exist, that's okay
      console.log('Note: completed_at column may not exist, continuing without it')
    }
  }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)
    .eq('business_id', businessId) // Extra safety check

  if (error) {
    console.error('Error updating job status:', error)
    
    // If error is about missing column, try again without completed_at
    if (error.message?.includes('completed_at') && status === 'completed') {
      console.log('Retrying without completed_at column...')
      const retryData = { status }
      const { error: retryError } = await supabase
        .from('jobs')
        .update(retryData)
        .eq('id', id)
        .eq('business_id', businessId)
      
      if (retryError) {
        throw new Error(`Failed to update job status: ${retryError.message}`)
      }
      // Success on retry - continue without completed_at
    } else {
      throw new Error(`Failed to update job status: ${error.message}`)
    }
  }

  // Auto-generate invoice and trigger review request when job is completed
  if (status === 'completed') {
    try {
      // Auto-generate invoice from completed job
      await createInvoiceFromJob(id)
    } catch (error) {
      console.error('Failed to create invoice from job:', error)
      // Don't fail the job update if invoice creation fails
    }
    
    try {
      await createReviewRequest(id)
    } catch (error) {
      console.error('Failed to create review request:', error)
      // Don't fail the job update if review request fails
    }

    // Auto-log mileage if mileage add-on is selected
    try {
      const { autoLogMileage } = await import('@/lib/actions/mileage')
      await autoLogMileage(id)
    } catch (error) {
      console.error('Failed to auto-log mileage:', error)
      // Don't fail the job update if mileage logging fails
    }
  }

  revalidatePath('/dashboard/jobs')
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // The scheduled_date should already be in ISO format (UTC) from the client
  // The client-side code converts datetime-local to UTC before sending
  const scheduledDate = formData.get('scheduled_date') as string | null

  // Convert hours to minutes for storage
  const durationHours = formData.get('estimated_duration') ? parseFloat(formData.get('estimated_duration') as string) : null
  let durationMinutes = durationHours ? Math.round(durationHours * 60) : null

  // Get add-ons from form data and calculate additional duration
  const addonsJson = formData.get('addons') as string | null
  let selectedAddons: any[] = []
  let addonDuration = 0

  if (addonsJson) {
    try {
      selectedAddons = JSON.parse(addonsJson)
      
      // If add-ons are provided, fetch their durations and add to total
      if (selectedAddons.length > 0 && Array.isArray(selectedAddons)) {
        const addonIds = selectedAddons
          .map(a => typeof a === 'string' ? a : a.id)
          .filter(Boolean)
        
        if (addonIds.length > 0) {
          const { data: addons } = await supabase
            .from('service_addons')
            .select('id, duration_minutes')
            .in('id', addonIds)
            .eq('business_id', businessId)
          
          if (addons) {
            addonDuration = addons.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
          }
        }
      }
    } catch (error) {
      console.error('Error parsing add-ons:', error)
      // Continue without add-ons if parsing fails
    }
  }

  // Add add-on duration to base duration
  const totalDuration = durationMinutes ? durationMinutes + addonDuration : null

  const jobData = {
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: scheduledDate,
    estimated_duration: totalDuration, // Base duration + add-on durations
    estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
    priority: formData.get('priority') as string || 'medium',
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip: formData.get('zip') as string || null,
    is_mobile_service: formData.get('is_mobile_service') === 'true',
    client_notes: formData.get('client_notes') as string || null,
    internal_notes: formData.get('internal_notes') as string || null,
    addons: selectedAddons.length > 0 ? selectedAddons : null, // Store add-ons in job record
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

export async function getJob(id: string) {
  // Check if in demo mode
  if (await isDemoMode()) {
    const { getMockJobs } = await import('@/lib/demo/mock-data')
    const mockJobs = getMockJobs()
    const job = mockJobs.find(j => j.id === id)
    if (!job) {
      throw new Error('Job not found')
    }
    // Return job with proper structure matching the database query
    return {
      ...job,
      client: job.client || null,
      assignments: job.assignments || [],
    }
  }

  const supabase = await createClient()

  // Try to include mileage, but don't fail if table doesn't exist yet
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(*),
      assignments:job_assignments(
        id,
        team_member:team_members!job_assignments_team_member_id_fkey(*)
      ),
      mileage_record:job_mileage(id, miles_driven, is_manual_override, from_address, from_city, from_state, from_zip)
    `)
    .eq('id', id)
    .single()

  // If error is about missing table/relation, try without mileage
  if (error && (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === 'PGRST116')) {
    const { data: jobWithoutMileage, error: error2 } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients(*),
        assignments:job_assignments(
          id,
          team_member:team_members!job_assignments_team_member_id_fkey(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error2) throw error2
    return jobWithoutMileage
  }

  if (error) throw error
  return job
}

export async function createJobFromLead(leadId: string, jobData: {
  title: string
  service_type?: string
  scheduled_date: string
  estimated_duration?: number
  estimated_cost?: number
  description?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  client_notes?: string
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get lead info
  const { data: lead } = await supabase
    .from('leads')
    .select('name, email, phone, interested_in_service_name, estimated_value')
    .eq('id', leadId)
    .eq('business_id', businessId)
    .single()

  if (!lead) throw new Error('Lead not found')

  // Find or create client from lead
  let clientId: string | null = null
  
  if (lead.email) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', lead.email)
      .single()

    if (existingClient) {
      clientId = existingClient.id
      // Update client info
      await supabase
        .from('clients')
        .update({
          name: lead.name,
          phone: lead.phone || null,
        })
        .eq('id', clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
        })
        .select()
        .single()

      if (clientError) throw clientError
      if (newClient) clientId = newClient.id
    }
  }

  // Convert scheduled_date to ISO string if it's not already
  let scheduledDateISO: string
  if (jobData.scheduled_date.includes('T')) {
    scheduledDateISO = new Date(jobData.scheduled_date).toISOString()
  } else {
    // Assume it's a date string, add default time
    scheduledDateISO = new Date(`${jobData.scheduled_date}T09:00:00`).toISOString()
  }

  // Create job (optionally linked to lead if column exists)
  const jobInsertData: any = {
    business_id: businessId,
    client_id: clientId,
    title: jobData.title,
    description: jobData.description || null,
    service_type: jobData.service_type || lead.interested_in_service_name || null,
    scheduled_date: scheduledDateISO,
    estimated_duration: jobData.estimated_duration || null,
    estimated_cost: jobData.estimated_cost || lead.estimated_value || null,
    status: 'scheduled',
    priority: 'medium',
    address: jobData.address || null,
    city: jobData.city || null,
    state: jobData.state || null,
    zip: jobData.zip || null,
    client_notes: jobData.client_notes || null,
  }
  
  // Try to add lead_id - if column doesn't exist, handle gracefully
  jobInsertData.lead_id = leadId

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert(jobInsertData)
    .select()
    .single()

  if (jobError) {
    // If error is about missing column, try without lead_id
    if (jobError.message?.includes('column') && jobError.message?.includes('lead_id')) {
      delete jobInsertData.lead_id
      const { data: retryJob, error: retryError } = await supabase
        .from('jobs')
        .insert(jobInsertData)
        .select()
        .single()
      
      if (retryError) {
        console.error('Error creating job from lead:', retryError)
        throw retryError
      }
      
      // Continue with job creation (without lead_id link)
      const job = retryJob
      
      // Update lead status to 'booked'
      await supabase
        .from('leads')
        .update({ 
          status: 'booked',
          job_id: job.id,
        })
        .eq('id', leadId)

      // Auto-link booking photos to the job
      await supabase
        .from('booking_photos')
        .update({ job_id: job.id })
        .eq('lead_id', leadId)
        .is('job_id', null)

      // Add interaction record
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: leadId,
          type: 'note',
          direction: 'outbound',
          content: `Job created: ${jobData.title}`,
          outcome: 'booked',
        })

      revalidatePath('/dashboard/leads')
      revalidatePath('/dashboard/leads/inbox')
      revalidatePath('/dashboard/jobs')
      
      return job
    }
    
    console.error('Error creating job from lead:', jobError)
    throw jobError
  }

  // Update lead status to 'booked'
  await supabase
    .from('leads')
    .update({ 
      status: 'booked',
      job_id: job.id,
    })
    .eq('id', leadId)

  // Auto-link booking photos to the job
  await supabase
    .from('booking_photos')
    .update({ job_id: job.id })
    .eq('lead_id', leadId)
    .is('job_id', null)

  // Add interaction record
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      type: 'note',
      direction: 'outbound',
      content: `Job created: ${jobData.title}`,
      outcome: 'booked',
    })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/leads/inbox')
  revalidatePath('/dashboard/jobs')
  
  return job
}

