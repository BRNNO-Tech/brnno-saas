'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockRecentPhotos } from '@/lib/demo/mock-data'
import type { BookingPhoto } from '@/types/booking-photos'

export interface CustomerDashboardPhoto {
  id: string
  storage_url: string
  uploaded_at: string
  source: 'customer'
  job_id: string
  job_title?: string
  photo_type: string
  ai_analysis?: any
  ai_processed?: boolean
}

export interface WorkerDashboardPhoto {
  id: string
  storage_url: string
  uploaded_at: string
  source: 'worker'
  job_id: string
  job_title?: string
  photo_type: string
  ai_analysis?: any
  ai_processed?: boolean
}

/**
 * Get recent photos from all jobs for dashboard display
 * Categorized by customer uploads (booking photos) vs worker uploads (job photos)
 */
export async function getRecentPhotos(limit: number = 20): Promise<{
  customerPhotos: CustomerDashboardPhoto[]
  workerPhotos: WorkerDashboardPhoto[]
  totalCount: number
}> {
  if (await isDemoMode()) {
    return getMockRecentPhotos(limit)
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get all jobs for this business
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(50) // Get recent 50 jobs

  if (!jobs || jobs.length === 0) {
    return {
      customerPhotos: [],
      workerPhotos: [],
      totalCount: 0
    }
  }

  const jobIds = jobs.map(j => j.id)

  // Get booking photos (customer uploads) - try job_id first, fall back to lead_id
  let customerPhotos: CustomerDashboardPhoto[] = []
  
  // First, try querying by job_id (new approach)
  const { data: bookingPhotosByJobId, error: jobIdError } = await supabase
    .from('booking_photos')
    .select('id, storage_url, uploaded_at, photo_type, ai_analysis, ai_processed, job_id')
    .in('job_id', jobIds)
    .order('uploaded_at', { ascending: false })
    .limit(limit)

  if (!jobIdError && bookingPhotosByJobId) {
    // Success - job_id column exists and query worked
    customerPhotos = bookingPhotosByJobId.map((photo): CustomerDashboardPhoto => {
      const job = jobs.find(j => j.id === photo.job_id)
      return {
        id: photo.id,
        storage_url: photo.storage_url,
        uploaded_at: photo.uploaded_at,
        source: 'customer',
        job_id: photo.job_id || '',
        job_title: job?.title,
        photo_type: photo.photo_type,
        ai_analysis: photo.ai_analysis,
        ai_processed: photo.ai_processed
      }
    })
  } else {
    // Fallback: query by lead_id (backward compatibility)
    const { data: jobsWithLeads } = await supabase
      .from('jobs')
      .select('id, title, lead_id')
      .in('id', jobIds)
      .not('lead_id', 'is', null)

    if (jobsWithLeads && jobsWithLeads.length > 0) {
      const leadIds = jobsWithLeads.map(j => j.lead_id!).filter(Boolean)
      
      if (leadIds.length > 0) {
        const { data: bookingPhotosByLeadId } = await supabase
          .from('booking_photos')
          .select('id, storage_url, uploaded_at, photo_type, ai_analysis, ai_processed, lead_id')
          .in('lead_id', leadIds)
          .order('uploaded_at', { ascending: false })
          .limit(limit)

        if (bookingPhotosByLeadId) {
          customerPhotos = bookingPhotosByLeadId.map((photo): CustomerDashboardPhoto => {
            const job = jobsWithLeads.find(j => j.lead_id === photo.lead_id)
            return {
              id: photo.id,
              storage_url: photo.storage_url,
              uploaded_at: photo.uploaded_at,
              source: 'customer',
              job_id: job?.id || '',
              job_title: job?.title,
              photo_type: photo.photo_type,
              ai_analysis: photo.ai_analysis,
              ai_processed: photo.ai_processed
            }
          })
        }
      }
    }
  }

  // Get job photos (worker uploads)
  let workerPhotos: WorkerDashboardPhoto[] = []
  if (jobIds.length > 0) {
    const { data: jobPhotos } = await supabase
      .from('job_photos')
      .select('id, storage_url, uploaded_at, photo_type, job_id, ai_analysis, ai_processed')
      .in('job_id', jobIds)
      .order('uploaded_at', { ascending: false })
      .limit(limit)

    if (jobPhotos) {
      // Map job photos to dashboard format
      workerPhotos = jobPhotos.map((photo): WorkerDashboardPhoto => {
        const job = jobs.find(j => j.id === photo.job_id)
        return {
          id: photo.id,
          storage_url: photo.storage_url,
          uploaded_at: photo.uploaded_at,
          source: 'worker',
          job_id: photo.job_id,
          job_title: job?.title,
          photo_type: photo.photo_type,
          ai_analysis: photo.ai_analysis,
          ai_processed: photo.ai_processed
        }
      })
    }
  }

  // Sort both arrays by uploaded_at (most recent first)
  customerPhotos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
  workerPhotos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())

  return {
    customerPhotos: customerPhotos.slice(0, limit) as CustomerDashboardPhoto[],
    workerPhotos: workerPhotos.slice(0, limit) as WorkerDashboardPhoto[],
    totalCount: customerPhotos.length + workerPhotos.length
  } satisfies {
    customerPhotos: CustomerDashboardPhoto[]
    workerPhotos: WorkerDashboardPhoto[]
    totalCount: number
  }
}
