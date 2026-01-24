'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import type { BookingPhoto } from '@/types/booking-photos'
import type { JobPhoto } from './job-photos'

export interface UnifiedJobPhotos {
  booking_photos: BookingPhoto[]
  job_photos: JobPhoto[]
  all_photos: Array<BookingPhoto | JobPhoto>
  total_count: number
  before_count: number
  after_count: number
  timeline: {
    phase: 'booking' | 'job'
    photo: BookingPhoto | JobPhoto
    timestamp: string
  }[]
}

/**
 * Get all photos for a job (booking + job photos combined)
 * This is the main function owners use to see complete photo history
 */
export async function getAllJobPhotos(jobId: string): Promise<UnifiedJobPhotos> {
  // Check if in demo mode
  if (await isDemoMode()) {
    const { getMockJobPhotos } = await import('@/lib/demo/mock-data')
    return getMockJobPhotos(jobId)
  }

  const supabase = await createClient()
  
  let businessId: string
  try {
    businessId = await getBusinessId()
  } catch (error) {
    console.error('Error getting business ID:', error)
    // Return empty result if business ID can't be retrieved
    return {
      booking_photos: [],
      job_photos: [],
      all_photos: [],
      total_count: 0,
      before_count: 0,
      after_count: 0,
      timeline: []
    }
  }

  // Verify job ownership
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, business_id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (jobError || !job) {
    // Log the error but return empty result instead of throwing
    console.warn('Job not found or not authorized:', { jobId, businessId, error: jobError })
    return {
      booking_photos: [],
      job_photos: [],
      all_photos: [],
      total_count: 0,
      before_count: 0,
      after_count: 0,
      timeline: []
    }
  }

  // Get job photos
  const { data: jobPhotos, error: jobPhotosError } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: true })

  if (jobPhotosError) {
    console.error('Error fetching job photos:', jobPhotosError)
  }

  // Get booking photos - try job_id first (new approach), fall back to lead_id if column doesn't exist
  let bookingPhotos: BookingPhoto[] = []
  
  // First, try querying by job_id (new approach)
  const { data: bookingPhotosByJobId, error: jobIdError } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: true })

  if (!jobIdError && bookingPhotosByJobId) {
    // Success - job_id column exists and query worked
    bookingPhotos = bookingPhotosByJobId as BookingPhoto[]
  } else {
    // Fallback: query by lead_id (backward compatibility for existing data)
    // Get job's lead_id first
    const { data: jobWithLead } = await supabase
      .from('jobs')
      .select('lead_id')
      .eq('id', jobId)
      .single()

    if (jobWithLead?.lead_id) {
      const { data: bookingPhotosByLeadId, error: leadIdError } = await supabase
        .from('booking_photos')
        .select('*')
        .eq('lead_id', jobWithLead.lead_id)
        .order('uploaded_at', { ascending: true })

      if (!leadIdError && bookingPhotosByLeadId) {
        bookingPhotos = bookingPhotosByLeadId as BookingPhoto[]
      } else if (leadIdError) {
        console.warn('Error fetching booking photos by lead_id:', leadIdError)
      }
    }
  }

  // Combine all photos
  const allPhotos = [
    ...(bookingPhotos || []),
    ...(jobPhotos || [])
  ]

  // Create timeline (chronological order)
  const timeline = [
    ...(bookingPhotos || []).map(photo => ({
      phase: 'booking' as const,
      photo: photo as BookingPhoto | JobPhoto,
      timestamp: photo.uploaded_at
    })),
    ...(jobPhotos || []).map(photo => ({
      phase: 'job' as const,
      photo: photo as BookingPhoto | JobPhoto,
      timestamp: photo.uploaded_at
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Count photos by type
  const beforeCount = [
    ...(bookingPhotos || []), // All booking photos are "before"
    ...(jobPhotos || []).filter(p => p.photo_type === 'before')
  ].length

  const afterCount = (jobPhotos || []).filter(p => p.photo_type === 'after').length

  return {
    booking_photos: bookingPhotos || [],
    job_photos: jobPhotos || [],
    all_photos: allPhotos,
    total_count: allPhotos.length,
    before_count: beforeCount,
    after_count: afterCount,
    timeline
  }
}

/**
 * Get photo count for a job (for badges on job cards)
 * Includes both booking and job photos
 */
export async function getJobPhotoCount(jobId: string): Promise<number> {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    // Return mock photo counts based on job ID
    // Some jobs have photos, some don't
    const mockPhotoCounts: Record<string, number> = {
      'demo-job-1': 3, // Has customer photos
      'demo-job-2': 2, // Has customer photos
      'demo-job-3': 1, // Has customer photos
      'demo-job-4': 4, // Has customer and worker photos
      'demo-job-5': 5, // Completed job with photos
      'demo-job-6': 2, // Completed job with photos
      'demo-job-7': 3, // Completed job with photos
      'demo-job-8': 4, // Completed job with photos
    }
    return mockPhotoCounts[jobId] || 0
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify job ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (!job) {
    return 0
  }

  // Count job photos
  const { count: jobCount } = await supabase
    .from('job_photos')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  // Count booking photos directly by job_id
  const { count: bookingCount } = await supabase
    .from('booking_photos')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  return (jobCount || 0) + (bookingCount || 0)
}

/**
 * Link a lead to a job (for photo lookups)
 * Call this when converting booking to job
 */
export async function linkLeadToJob(leadId: string, jobId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify job ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (!job) {
    throw new Error('Job not found or not authorized')
  }

  // Update job with lead_id
  const { error } = await supabase
    .from('jobs')
    .update({ lead_id: leadId })
    .eq('id', jobId)
    .eq('business_id', businessId)

  if (error) {
    throw new Error(`Failed to link lead to job: ${error.message}`)
  }

  return { success: true }
}

/**
 * Get booking photos for display in job details
 * Formats them to look like job photos for consistent UI
 */
export async function getBookingPhotosForJob(jobId: string): Promise<JobPhoto[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify job ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (!job) {
    return []
  }

  // Get booking photos directly by job_id
  const { data: bookingPhotos } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: true })

  if (!bookingPhotos) {
    return []
  }

  // Convert booking photos to job photo format
  return bookingPhotos.map(photo => ({
    id: photo.id,
    job_id: jobId,
    assignment_id: null,
    photo_type: 'before' as const, // All booking photos are "before"
    storage_path: photo.storage_path,
    storage_url: photo.storage_url,
    uploaded_by: null,
    description: `Customer uploaded during booking (${photo.photo_type})`,
    ai_analysis: photo.ai_analysis,
    ai_tags: photo.ai_analysis?.detected_issues || [],
    ai_confidence_score: photo.ai_analysis?.confidence,
    ai_detected_issues: photo.ai_analysis?.detected_issues || [],
    ai_suggested_services: [],
    ai_generated_caption: photo.ai_analysis?.reasoning,
    ai_processed_at: photo.ai_processed_at,
    is_featured: false,
    sort_order: -1, // Show booking photos first
    uploaded_at: photo.uploaded_at,
    created_at: photo.created_at
  })) as JobPhoto[]
}

/**
 * Check if job has booking photos
 */
export async function hasBookingPhotos(jobId: string): Promise<boolean> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (!job) {
    return false
  }

  const { count } = await supabase
    .from('booking_photos')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  return (count || 0) > 0
}
