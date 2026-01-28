'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { getWorkerProfile } from './worker-auth'
import { revalidatePath } from 'next/cache'

export interface JobPhoto {
  id: string
  job_id: string
  assignment_id?: string | null
  photo_type: 'before' | 'after' | 'other'
  storage_path: string
  storage_url: string
  uploaded_by?: string | null
  description?: string | null
  ai_analysis?: any
  ai_tags?: string[]
  ai_confidence_score?: number
  ai_detected_issues?: string[]
  ai_suggested_services?: string[]
  ai_generated_caption?: string
  ai_processed_at?: string | null
  is_featured: boolean
  sort_order: number
  uploaded_at: string
}

/**
 * Upload a job photo (universal - works for solo users, owners, and workers)
 * If assignmentId is provided, links to worker assignment
 * If not provided, it's a direct job upload (solo user or owner)
 */
export async function uploadJobPhoto(
  jobId: string,
  file: File,
  photoType: 'before' | 'after' | 'other',
  options?: {
    assignmentId?: string
    description?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get business ID to verify ownership
  const businessId = await getBusinessId()

  // Verify job belongs to user's business
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, business_id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or unauthorized')
  }

  // Check if user is a worker with assignment, or business owner
  let isAuthorized = false
  let uploadedBy = user.id

  if (options?.assignmentId) {
    // Check if assignment exists and user is the assigned worker
    const worker = await getWorkerProfile()
    if (worker) {
      const { data: assignment } = await supabase
        .from('job_assignments')
        .select('id, team_member_id')
        .eq('id', options.assignmentId)
        .eq('job_id', jobId)
        .eq('team_member_id', worker.id)
        .single()

      if (assignment) {
        isAuthorized = true
        uploadedBy = worker.user_id || user.id
      }
    }
  } else {
    // Business owner uploading directly - already verified via business_id check
    isAuthorized = true
  }

  if (!isAuthorized) {
    throw new Error('Not authorized to upload photos for this job')
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = options?.assignmentId
    ? `${jobId}/${options.assignmentId}/${timestamp}.${fileExt}`
    : `${jobId}/owner/${timestamp}.${fileExt}`

  const filePath = `job-photos/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('job-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error(`Failed to upload photo: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('job-photos')
    .getPublicUrl(filePath)

  // Create database record
  const { data: photo, error: dbError } = await supabase
    .from('job_photos')
    .insert({
      job_id: jobId,
      assignment_id: options?.assignmentId || null,
      photo_type: photoType,
      storage_path: filePath,
      storage_url: publicUrl,
      uploaded_by: uploadedBy,
      description: options?.description || null,
      is_featured: false,
      sort_order: 0
    })
    .select()
    .single()

  if (dbError) {
    // If database insert fails, try to delete the uploaded file
    await supabase.storage.from('job-photos').remove([filePath])
    throw new Error(`Failed to save photo record: ${dbError.message}`)
  }

  revalidatePath('/dashboard/jobs')
  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/worker/jobs')
  revalidatePath(`/worker/jobs/${jobId}`)

  return photo as JobPhoto
}

/**
 * Get all photos for a job (across all assignments + direct uploads + booking photos)
 * Includes both worker-uploaded job photos and customer-uploaded booking photos
 */
export async function getJobPhotos(jobId: string) {
  const supabase = await createClient()

  // Get the job first to get business_id
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, business_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Verify user has access to this job (either as business owner or assigned worker)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is the business owner
  const { data: ownerBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .eq('id', job.business_id)
    .single()

  // If not business owner, check if user is an assigned worker
  if (!ownerBusiness) {
    const { data: workerAssignment } = await supabase
      .from('job_assignments')
      .select('id, team_member:team_members!inner(user_id)')
      .eq('job_id', jobId)
      .eq('team_members.user_id', user.id)
      .single()

    if (!workerAssignment) {
      throw new Error('Unauthorized to view this job')
    }
  }

  // Get job photos (worker uploads)
  const { data: jobPhotos, error: jobPhotosError } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true })
    .order('uploaded_at', { ascending: false })

  if (jobPhotosError) {
    console.error('Error fetching job photos:', jobPhotosError)
    throw new Error(`Failed to fetch job photos: ${jobPhotosError.message}`)
  }

  // Get booking photos (customer uploads) - try job_id first, fall back to lead_id
  let bookingPhotos: any[] = []

  // First, try querying by job_id (new approach)
  const { data: bookingPhotosByJobId, error: jobIdError } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: true })

  if (!jobIdError && bookingPhotosByJobId) {
    // Success - job_id column exists and query worked
    bookingPhotos = bookingPhotosByJobId
  } else {
    // Fallback: query by lead_id (backward compatibility)
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
        bookingPhotos = bookingPhotosByLeadId
      }
    }
  }

  // Convert booking photos to JobPhoto format for consistency
  const convertedBookingPhotos: JobPhoto[] = (bookingPhotos || []).map(photo => ({
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
    uploaded_at: photo.uploaded_at
  }))

  // Combine and sort: booking photos first (sort_order -1), then job photos
  const allPhotos = [...convertedBookingPhotos, ...(jobPhotos || [])]
    .sort((a, b) => {
      // First sort by sort_order (booking photos have -1)
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order
      }
      // Then by uploaded_at (most recent first)
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    })

  return allPhotos as JobPhoto[]
}

/**
 * Get photos for a specific assignment (worker view)
 * Includes both assignment-specific photos and booking photos (customer uploads) for the job
 * Workers need to see customer-uploaded "before" photos to understand vehicle condition
 */
export async function getAssignmentPhotos(assignmentId: string) {
  const supabase = await createClient()
  const worker = await getWorkerProfile()

  if (!worker) {
    throw new Error('Worker not authenticated')
  }

  // Verify assignment belongs to worker and get job_id
  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('id, team_member_id, job_id')
    .eq('id', assignmentId)
    .eq('team_member_id', worker.id)
    .single()

  if (!assignment) {
    throw new Error('Assignment not found or unauthorized')
  }

  // Get assignment-specific photos
  const { data: assignmentPhotos, error: assignmentPhotosError } = await supabase
    .from('job_photos')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('uploaded_at', { ascending: false })

  if (assignmentPhotosError) {
    console.error('Error fetching assignment photos:', assignmentPhotosError)
    throw new Error(`Failed to fetch assignment photos: ${assignmentPhotosError.message}`)
  }

  // Get booking photos (customer uploads) for the job - try job_id first, fall back to lead_id
  let bookingPhotos: any[] = []

  // First, try querying by job_id (new approach)
  const { data: bookingPhotosByJobId, error: jobIdError } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('job_id', assignment.job_id)
    .order('uploaded_at', { ascending: true })

  if (!jobIdError && bookingPhotosByJobId) {
    // Success - job_id column exists and query worked
    bookingPhotos = bookingPhotosByJobId
  } else {
    // Fallback: query by lead_id (backward compatibility)
    const { data: jobWithLead } = await supabase
      .from('jobs')
      .select('lead_id')
      .eq('id', assignment.job_id)
      .single()

    if (jobWithLead?.lead_id) {
      const { data: bookingPhotosByLeadId, error: leadIdError } = await supabase
        .from('booking_photos')
        .select('*')
        .eq('lead_id', jobWithLead.lead_id)
        .order('uploaded_at', { ascending: true })

      if (!leadIdError && bookingPhotosByLeadId) {
        bookingPhotos = bookingPhotosByLeadId
      }
    }
  }

  // Convert booking photos to JobPhoto format for consistency
  const convertedBookingPhotos: JobPhoto[] = (bookingPhotos || []).map(photo => ({
    id: photo.id,
    job_id: assignment.job_id,
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
    uploaded_at: photo.uploaded_at
  }))

  // Combine: booking photos first (customer condition), then assignment photos
  const allPhotos = [...convertedBookingPhotos, ...(assignmentPhotos || [])]
    .sort((a, b) => {
      // First sort by sort_order (booking photos have -1)
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order
      }
      // Then by uploaded_at (most recent first)
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    })

  return allPhotos as JobPhoto[]
}

/**
 * Delete a photo
 */
export async function deleteJobPhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const businessId = await getBusinessId()

  // Get photo with job info to verify ownership
  const { data: photo, error: fetchError } = await supabase
    .from('job_photos')
    .select(`
      id,
      storage_path,
      job_id,
      assignment_id,
      job:jobs(business_id)
    `)
    .eq('id', photoId)
    .single()

  if (fetchError || !photo) {
    throw new Error('Photo not found')
  }

  // Verify job belongs to user's business
  const jobBusinessId = (photo.job as any)?.business_id
  if (jobBusinessId !== businessId) {
    // Also check if user is a worker assigned to this job
    if (photo.assignment_id) {
      const worker = await getWorkerProfile()
      if (worker) {
        const { data: assignment } = await supabase
          .from('job_assignments')
          .select('team_member_id')
          .eq('id', photo.assignment_id)
          .eq('team_member_id', worker.id)
          .single()

        if (!assignment) {
          throw new Error('Not authorized to delete this photo')
        }
      } else {
        throw new Error('Not authorized to delete this photo')
      }
    } else {
      throw new Error('Not authorized to delete this photo')
    }
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('job-photos')
    .remove([photo.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('job_photos')
    .delete()
    .eq('id', photoId)

  if (dbError) {
    throw new Error(`Failed to delete photo: ${dbError.message}`)
  }

  revalidatePath('/dashboard/jobs')
  revalidatePath(`/dashboard/jobs/${photo.job_id}`)
  revalidatePath('/worker/jobs')
  revalidatePath(`/worker/jobs/${photo.job_id}`)

  return { success: true }
}

/**
 * Update photo metadata (description, featured, sort order)
 */
export async function updateJobPhoto(
  photoId: string,
  updates: {
    description?: string
    is_featured?: boolean
    sort_order?: number
  }
) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify ownership
  const { data: photo } = await supabase
    .from('job_photos')
    .select(`
      job_id,
      assignment_id,
      job:jobs(business_id)
    `)
    .eq('id', photoId)
    .single()

  if (!photo) {
    throw new Error('Photo not found')
  }

  // Verify job belongs to user's business
  const jobBusinessId = (photo.job as any)?.business_id
  if (jobBusinessId !== businessId) {
    // Also check if user is a worker assigned to this job
    if (photo.assignment_id) {
      const worker = await getWorkerProfile()
      if (worker) {
        const { data: assignment } = await supabase
          .from('job_assignments')
          .select('team_member_id')
          .eq('id', photo.assignment_id)
          .eq('team_member_id', worker.id)
          .single()

        if (!assignment) {
          throw new Error('Not authorized')
        }
      } else {
        throw new Error('Not authorized')
      }
    } else {
      throw new Error('Not authorized')
    }
  }

  const { data: updated, error } = await supabase
    .from('job_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update photo: ${error.message}`)
  }

  revalidatePath('/dashboard/jobs')
  revalidatePath(`/dashboard/jobs/${photo.job_id}`)
  revalidatePath('/worker/jobs')
  revalidatePath(`/worker/jobs/${photo.job_id}`)

  return updated as JobPhoto
}

/**
 * Get photo count for a job (for badges)
 * Includes both booking photos (customer uploads) and job photos (worker uploads)
 */
export async function getJobPhotoCount(jobId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify job belongs to user's business
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
  const { count: jobCount, error: jobError } = await supabase
    .from('job_photos')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  if (jobError) {
    console.error('Error counting job photos:', jobError)
  }

  // Count booking photos - try job_id first, fall back to lead_id
  let bookingCount = 0

  // First, try querying by job_id (new approach)
  const { count: bookingCountByJobId, error: jobIdError } = await supabase
    .from('booking_photos')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  if (!jobIdError && bookingCountByJobId !== null) {
    // Success - job_id column exists and query worked
    bookingCount = bookingCountByJobId || 0
  } else {
    // Fallback: query by lead_id (backward compatibility)
    const { data: jobWithLead } = await supabase
      .from('jobs')
      .select('lead_id')
      .eq('id', jobId)
      .single()

    if (jobWithLead?.lead_id) {
      const { count: bookingCountByLeadId, error: leadIdError } = await supabase
        .from('booking_photos')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', jobWithLead.lead_id)

      if (!leadIdError && bookingCountByLeadId !== null) {
        bookingCount = bookingCountByLeadId || 0
      }
    }
  }

  return (jobCount || 0) + bookingCount
}

/**
 * Store AI analysis results for a photo
 * This will be called by your future AI analyzer
 */
export async function savePhotoAIAnalysis(
  photoId: string,
  analysis: {
    ai_analysis?: any
    ai_tags?: string[]
    ai_confidence_score?: number
    ai_detected_issues?: string[]
    ai_suggested_services?: string[]
    ai_generated_caption?: string
  }
) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify photo belongs to user's business
  const { data: photo } = await supabase
    .from('job_photos')
    .select(`
      id,
      job:jobs(business_id)
    `)
    .eq('id', photoId)
    .single()

  if (!photo) {
    throw new Error('Photo not found')
  }

  const jobBusinessId = (photo.job as any)?.business_id
  if (jobBusinessId !== businessId) {
    throw new Error('Not authorized')
  }

  const { data: updated, error } = await supabase
    .from('job_photos')
    .update({
      ...analysis,
      ai_processed_at: new Date().toISOString()
    })
    .eq('id', photoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save AI analysis: ${error.message}`)
  }

  return updated as JobPhoto
}
