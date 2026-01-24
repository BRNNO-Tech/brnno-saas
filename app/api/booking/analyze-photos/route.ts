import { NextRequest, NextResponse } from 'next/server'
import { analyzeLeadPhotos } from '@/lib/actions/booking-photos'
import type { VehicleSize } from '@/types/booking-photos'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, vehicleType } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing leadId' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis service not configured' },
        { status: 500 }
      )
    }

    const analysis = await analyzeLeadPhotos(leadId, vehicleType as VehicleSize)

    return NextResponse.json({ 
      success: true,
      ...analysis
    })
  } catch (error: any) {
    console.error('Error analyzing photos:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze photos' },
      { status: 500 }
    )
  }
}
