import { NextRequest, NextResponse } from 'next/server'
import { saveBookingPhotoAIAnalysis, saveBookingPhotoAIError } from '@/lib/actions/booking-photos'
import { analyzeVehiclePhoto, imageUrlToBase64 } from '@/lib/ai/gemini-photo-analysis'
import { loadBusinessAndCheckAIPhotoAnalysisAccess } from '@/lib/ai/photo-analysis-access'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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
      .select('ai_processed, ai_processed_at, business_id')
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

    const businessId = existingPhoto.business_id
    const hasAccess = await loadBusinessAndCheckAIPhotoAnalysisAccess(supabaseService, businessId)

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            'AI Photo Analysis is not enabled for this business. Upgrade to Pro/Fleet or add the AI Photo Analyzer add-on.',
        },
        { status: 403 }
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
