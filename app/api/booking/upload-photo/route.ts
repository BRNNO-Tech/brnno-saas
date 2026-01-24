import { NextRequest, NextResponse } from 'next/server'
import { uploadBookingPhoto } from '@/lib/actions/booking-photos'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const leadId = formData.get('leadId') as string
    const businessId = formData.get('businessId') as string
    const photoType = formData.get('photoType') as 'exterior' | 'interior' | 'problem_area' | 'other'

    if (!file || !leadId || !businessId || !photoType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const photo = await uploadBookingPhoto(leadId, businessId, file, photoType)

    return NextResponse.json({ 
      success: true,
      photo 
    })
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
