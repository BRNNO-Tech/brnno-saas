import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, step, data, abandoned } = body

    if (!leadId || !step) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Use service role client to bypass RLS for public booking leads
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase service role key')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Calculate booking progress percentage (1-4 steps = 25% each, step 5 = 100%)
    const progressPercentage = step === 5 ? 100 : step * 25

    const updateData: any = {
      booking_progress: progressPercentage,
    }

    // If abandoned, mark the step
    if (abandoned) {
      const stepNames: Record<number, string> = {
        1: 'email_capture',
        2: 'date_time_selection',
        3: 'contact_details',
        4: 'address_asset',
      }
      updateData.abandoned_at_step = stepNames[step] || `step_${step}`
    }

    // Update fields based on step
    if (step === 2 && data?.preferredDate && data?.preferredTime) {
      updateData.preferred_date = data.preferredDate
      updateData.preferred_time = data.preferredTime
    }

    if (step === 3 && data) {
      if (data.phone) {
        updateData.phone = data.phone
      }
      if (data.notes) {
        updateData.notes = data.notes
      }
    }

    // Step 7: address and vehicle/asset details (collected before checkout)
    if (step === 7 && data) {
      if (data.address != null) updateData.address = data.address
      if (data.city != null) updateData.city = data.city
      if (data.state != null) updateData.state = data.state
      if (data.zip != null) updateData.zip = data.zip
      if (data.source != null) updateData.source = data.source
      if (data.assetDetails != null) updateData.asset_details = data.assetDetails
      if (data.vehicleType != null) updateData.vehicle_type = data.vehicleType
      if (data.vehicleColor != null) updateData.vehicle_color = data.vehicleColor
      if (data.condition != null) updateData.vehicle_condition = data.condition
    }

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error in update-lead API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

