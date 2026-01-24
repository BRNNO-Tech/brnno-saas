'use server'

import { createClient } from '@supabase/supabase-js'
import { analyzeBookingPhotos, generateAddonSuggestions } from '@/lib/ai/gemini-photo-analysis'
import type { BookingPhoto, AIAnalysisSummary, VehicleSize } from '@/types/booking-photos'
import { revalidatePath } from 'next/cache'

// Create service role client for booking operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Upload a booking photo to Supabase Storage
 */
export async function uploadBookingPhoto(
  leadId: string,
  businessId: string,
  file: File,
  photoType: 'exterior' | 'interior' | 'problem_area' | 'other'
) {
  const supabase = getSupabaseClient()

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${leadId}/${photoType}/${timestamp}.${fileExt}`
  const filePath = `booking-photos/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('booking-photos')
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
    .from('booking-photos')
    .getPublicUrl(filePath)

  // Create database record
  const { data: photo, error: dbError } = await supabase
    .from('booking_photos')
    .insert({
      lead_id: leadId,
      business_id: businessId,
      photo_type: photoType,
      storage_path: filePath,
      storage_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      ai_processed: false
    })
    .select()
    .single()

  if (dbError) {
    // If database insert fails, try to delete the uploaded file
    await supabase.storage.from('booking-photos').remove([filePath])
    throw new Error(`Failed to save photo record: ${dbError.message}`)
  }

  // Update lead to mark photos as uploaded
  await supabase
    .from('leads')
    .update({ photos_uploaded: true })
    .eq('id', leadId)

  return photo as BookingPhoto
}

/**
 * Get all photos for a lead
 */
export async function getLeadPhotos(leadId: string): Promise<BookingPhoto[]> {
  const supabase = getSupabaseClient()

  const { data: photos, error } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('lead_id', leadId)
    .order('uploaded_at', { ascending: true })

  if (error) {
    console.error('Error fetching photos:', error)
    throw new Error(`Failed to fetch photos: ${error.message}`)
  }

  return (photos || []) as BookingPhoto[]
}

/**
 * Get all photos for a lead (alias for compatibility)
 */
export async function getBookingPhotos(leadId: string): Promise<BookingPhoto[]> {
  return getLeadPhotos(leadId)
}

/**
 * Analyze booking photos with AI and update lead
 */
export async function analyzeLeadPhotos(
  leadId: string,
  vehicleType?: VehicleSize
): Promise<AIAnalysisSummary> {
  const supabase = getSupabaseClient()

  // Get photos for this lead
  const photos = await getLeadPhotos(leadId)

  if (photos.length === 0) {
    throw new Error('No photos to analyze')
  }

  // Download photos and convert to base64
  const photoData = await Promise.all(
    photos.map(async (photo) => {
      try {
        // Fetch image from public URL
        const response = await fetch(photo.storage_url)
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        
        return {
          base64,
          type: photo.photo_type as 'exterior' | 'interior' | 'problem_area'
        }
      } catch (error) {
        console.error(`Failed to fetch photo ${photo.id}:`, error)
        return null
      }
    })
  )

  // Filter out failed downloads
  const validPhotos = photoData.filter((p): p is NonNullable<typeof p> => p !== null)

  if (validPhotos.length === 0) {
    throw new Error('Failed to download photos for analysis')
  }

  // Analyze with Gemini AI
  const analysis = await analyzeBookingPhotos(validPhotos, vehicleType)

  // Update lead with AI results
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      ai_vehicle_size: analysis.vehicle_size_detected,
      ai_condition: analysis.overall_condition,
      ai_detected_issues: analysis.primary_issues,
      ai_confidence_score: analysis.confidence,
      ai_analysis_summary: analysis,
      photos_uploaded: true
    })
    .eq('id', leadId)

  if (updateError) {
    console.error('Failed to update lead with AI results:', updateError)
    // Don't throw - analysis succeeded even if update failed
  }

  // Mark photos as processed
  await supabase
    .from('booking_photos')
    .update({
      ai_processed: true,
      ai_processed_at: new Date().toISOString()
    })
    .eq('lead_id', leadId)

  revalidatePath('/dashboard/leads')
  revalidatePath(`/dashboard/leads/${leadId}`)

  return analysis
}

/**
 * Get suggested add-ons based on AI detected issues
 */
export async function getAISuggestedAddons(
  leadId: string,
  businessId: string
) {
  const supabase = getSupabaseClient()

  // Get lead with AI data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('ai_detected_issues')
    .eq('id', leadId)
    .single()

  if (leadError || !lead || !lead.ai_detected_issues || lead.ai_detected_issues.length === 0) {
    return []
  }

  // Get available add-ons for this business
  const { data: addons, error: addonsError } = await supabase
    .from('service_addons')
    .select('id, name, description')
    .eq('business_id', businessId)
    .eq('is_active', true)

  if (addonsError || !addons) {
    return []
  }

  // Generate suggestions
  const suggestions = generateAddonSuggestions(
    lead.ai_detected_issues,
    addons.map(a => ({ id: a.id, name: a.name, keywords: [] }))
  )

  // Save suggestions to lead
  await supabase
    .from('leads')
    .update({
      ai_suggested_addons: suggestions
    })
    .eq('id', leadId)

  revalidatePath('/dashboard/leads')
  revalidatePath(`/dashboard/leads/${leadId}`)

  return suggestions
}

/**
 * Delete a booking photo
 */
export async function deleteBookingPhoto(photoId: string) {
  const supabase = getSupabaseClient()

  // Get photo to get storage path
  const { data: photo, error: fetchError } = await supabase
    .from('booking_photos')
    .select('storage_path, lead_id')
    .eq('id', photoId)
    .single()

  if (fetchError || !photo) {
    throw new Error('Photo not found')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('booking-photos')
    .remove([photo.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('booking_photos')
    .delete()
    .eq('id', photoId)

  if (dbError) {
    throw new Error(`Failed to delete photo: ${dbError.message}`)
  }

  revalidatePath('/dashboard/leads')
  revalidatePath(`/dashboard/leads/${photo.lead_id}`)

  return { success: true }
}

/**
 * Save AI analysis results for a single photo
 * (Used by the individual photo analysis API route)
 */
export async function saveBookingPhotoAIAnalysis(
  photoId: string,
  analysis: any
): Promise<BookingPhoto> {
  const supabase = getSupabaseClient()

  const { data: updated, error } = await supabase
    .from('booking_photos')
    .update({
      ai_analysis: analysis,
      ai_processed: true,
      ai_processed_at: new Date().toISOString(),
      ai_error: null
    })
    .eq('id', photoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save AI analysis: ${error.message}`)
  }

  return updated as BookingPhoto
}

/**
 * Save AI analysis error for a photo
 */
export async function saveBookingPhotoAIError(
  photoId: string,
  errorMessage: string
): Promise<void> {
  const supabase = getSupabaseClient()

  await supabase
    .from('booking_photos')
    .update({
      ai_processed: true,
      ai_error: errorMessage,
      ai_processed_at: new Date().toISOString()
    })
    .eq('id', photoId)
}
