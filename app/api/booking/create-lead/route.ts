import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, name, email, serviceId, serviceName, servicePrice } = body

    if (!businessId || !name || !email || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for public booking leads
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { 
          error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable',
          hint: 'Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get service details if not provided
    let finalServiceName = serviceName
    let finalServicePrice = servicePrice

    if (!finalServiceName || !finalServicePrice) {
      const { data: service } = await supabase
        .from('services')
        .select('name, price')
        .eq('id', serviceId)
        .eq('business_id', businessId)
        .single()

      if (service) {
        finalServiceName = service.name
        finalServicePrice = service.price
      }
    }

    // Check lead limit for Starter plan (but allow booking leads to go through with warning)
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_status')
      .eq('id', businessId)
      .single()

    let limitWarning = null
    if (business) {
      const { getTierFromBusiness, getMaxLeads } = await import('@/lib/permissions')
      const tier = getTierFromBusiness(business)
      const maxLeads = getMaxLeads(tier)
      
      if (maxLeads > 0) {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
        
        const currentCount = count || 0
        if (currentCount >= maxLeads) {
          // Still allow booking leads but add warning
          limitWarning = `Lead limit reached (${maxLeads} leads). This lead was created but you may want to upgrade to Pro for unlimited leads.`
        }
      }
    }

    // Calculate initial lead score
    const leadData = {
      estimated_value: finalServicePrice,
      status: 'new',
      follow_up_count: 0,
      created_at: new Date().toISOString(),
      email: email.trim(),
      phone: null,
      last_contacted_at: null,
    }

    // Simple score calculation (hot/warm/cold)
    let score = 0
    if (leadData.estimated_value) {
      if (leadData.estimated_value >= 1000) score += 25
      else if (leadData.estimated_value >= 500) score += 15
      else if (leadData.estimated_value >= 100) score += 5
    }
    score += 20 // Created today = hot
    score += 5 // Has email

    const calculatedScore = score >= 50 ? 'hot' : score >= 25 ? 'warm' : 'cold'

    // Create lead with minimal info
    const leadInsertData = {
      business_id: businessId,
      name: name.trim(),
      email: email.trim(),
      phone: null,
      source: 'online_booking',
      interested_in_service_id: serviceId,
      interested_in_service_name: finalServiceName,
      estimated_value: finalServicePrice,
      status: 'new',
      booking_progress: 1, // Step 1: Email captured
      abandoned_at_step: null,
      follow_up_count: 0,
      score: calculatedScore,
    }

    console.log('Attempting to create lead with data:', {
      ...leadInsertData,
      email: '[REDACTED]' // Don't log email in production
    })

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadInsertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create lead',
          details: {
            message: error.message,
            hint: error.hint,
            code: error.code,
            details: error.details
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      lead,
      warning: limitWarning || undefined
    })
  } catch (err: any) {
    console.error('Error in create-lead API:', err)
    const errorMessage = err.message || 'Internal server error'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: {
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
      },
      { status: 500 }
    )
  }
}

