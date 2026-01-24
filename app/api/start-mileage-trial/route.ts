import { NextRequest, NextResponse } from 'next/server'
import { startMileageTrial } from '@/lib/actions/subscription-addons'
import { getBusinessId } from '@/lib/actions/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body

    const targetBusinessId = businessId || await getBusinessId()

    const addon = await startMileageTrial(targetBusinessId)

    return NextResponse.json({ 
      success: true,
      addon 
    })
  } catch (error: any) {
    console.error('Error starting mileage trial:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start trial' },
      { status: 400 }
    )
  }
}
