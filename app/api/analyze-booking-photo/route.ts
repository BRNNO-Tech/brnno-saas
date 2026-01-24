import { NextRequest, NextResponse } from 'next/server'
import { saveBookingPhotoAIAnalysis, saveBookingPhotoAIError } from '@/lib/actions/booking-photos'
import { analyzeVehiclePhoto, imageUrlToBase64 } from '@/lib/ai/gemini-photo-analysis'
import { hasSubscriptionAddon } from '@/lib/actions/subscription-addons'
import { getBusinessId } from '@/lib/actions/utils'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/permissions'
import type { AIPhotoAnalysis } from '@/types/booking-photos'

/**
 * API route to analyze a booking photo with Gemini AI
 */
export async function POST(request: NextRequest) {
  let photoId: string | undefined
  
  try {
    const body = await request.json()
    const { photoId: bodyPhotoId, photoUrl, photoType, vehicleType } = body
    photoId = bodyPhotoId

    if (!photoId || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing photoId or photoUrl' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is configured first
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.error('GEMINI_API_KEY is not configured or is empty')
      return NextResponse.json(
        { error: 'AI analysis service is not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Use service role client for public booking access (customers aren't authenticated)
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get photo with business_id to check permissions
    const { data: existingPhoto, error: photoError } = await supabaseService
      .from('booking_photos')
      .select('ai_processed, ai_processed_at, business_id, business:businesses(owner_id)')
      .eq('id', photoId)
      .single()

    if (photoError || !existingPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Check if photo was already analyzed (duplicate detection)
    if (existingPhoto.ai_processed) {
      return NextResponse.json(
        { error: 'Photo already analyzed', duplicate: true },
        { status: 409 }
      )
    }

    // Check if business has AI photo analysis addon or business owner is admin
    const businessId = existingPhoto.business_id
    let hasAccess = false
    
    // Get business owner email to check if admin
    const { data: business } = await supabaseService
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()
    
    if (business?.owner_id) {
      // Get business owner email using admin API
      try {
        const { data: owner } = await supabaseService.auth.admin.getUserById(business.owner_id)
        if (owner?.user?.email && isAdminEmail(owner.user.email)) {
          hasAccess = true
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }
    
    // If not admin, check for subscription addon directly
    if (!hasAccess) {
      const { data: addon } = await supabaseService
        .from('business_subscription_addons')
        .select('id, status, trial_ends_at')
        .eq('business_id', businessId)
        .eq('addon_key', 'ai_photo_analysis')
        .in('status', ['active', 'trial'])
        .single()
      
      if (addon) {
        // If it's a trial, check if it's still valid
        if (addon.status === 'trial') {
          const now = new Date()
          const trialEndsAt = addon.trial_ends_at ? new Date(addon.trial_ends_at) : null
          hasAccess = !!(trialEndsAt && trialEndsAt >= now)
        } else {
          // Status is 'active'
          hasAccess = true
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'AI Photo Analysis add-on is required. Please subscribe to use this feature.' },
        { status: 403 }
      )
    }

    if (existingPhoto?.ai_processed) {
      return NextResponse.json(
        { error: 'Photo already analyzed', duplicate: true },
        { status: 409 }
      )
    }

    // Convert image URL to base64 (image should already be resized to 768px max)
    const imageBase64 = await imageUrlToBase64(photoUrl)

    // Analyze photo with Gemini
    const analysis = await analyzeVehiclePhoto(
      imageBase64,
      photoType || 'exterior',
      vehicleType
    )

    // Save analysis to database
    await saveBookingPhotoAIAnalysis(photoId, analysis)

    return NextResponse.json({ 
      success: true,
      analysis
    })
  } catch (error: any) {
    console.error('Error analyzing photo:', error)
    
    // Check for API key errors specifically
    let errorMessage = error.message || 'Failed to analyze photo'
    let statusCode = 500
    
    if (error.message?.includes('API key not valid') || error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.'
      statusCode = 500
    } else if (error.message?.includes('API key not found') || error.message?.includes('API key not configured')) {
      errorMessage = 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.'
      statusCode = 500
    }
    
    // Try to save error to database if we have photoId
    if (photoId) {
      try {
        await saveBookingPhotoAIError(photoId, errorMessage)
      } catch (saveError) {
        console.error('Error saving AI error to database:', saveError)
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
