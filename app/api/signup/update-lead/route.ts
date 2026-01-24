import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { leadId, step, data, abandoned } = await request.json()

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const stepNames: Record<number, string> = {
      1: 'email_collected',
      2: 'account_created',
      3: 'business_info',
      4: 'customization',
      5: 'subscription_selected',
    }

    const updateData: any = {
      current_step: step || 1,
      updated_at: new Date().toISOString(),
    }

    // Mark step completion
    if (step === 2) updateData.step_2_completed_at = new Date().toISOString()
    if (step === 3) updateData.step_3_completed_at = new Date().toISOString()
    if (step === 4) updateData.step_4_completed_at = new Date().toISOString()

    // Update additional data
    if (data) {
      if (data.name) updateData.name = data.name
      if (data.selectedPlan) updateData.selected_plan = data.selectedPlan
      if (data.teamSize) updateData.team_size = data.teamSize
      if (data.billingPeriod) updateData.billing_period = data.billingPeriod
    }

    // Mark as abandoned if needed
    if (abandoned) {
      updateData.abandoned_at_step = stepNames[step] || `step_${step}`
      updateData.abandoned_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('signup_leads')
      .update(updateData)
      .eq('id', leadId)

    if (error) {
      console.error('Update signup lead error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update signup lead error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update lead',
        details: error 
      },
      { status: 500 }
    )
  }
}

