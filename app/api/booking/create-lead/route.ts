import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizePhoneNumber } from '@/lib/utils/phone'

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
    const { businessId, name, email, phone, serviceId, serviceName, servicePrice, smsConsent, booking_progress } = body

    // Allow creating lead with just businessId and serviceId (for beginning of booking flow)
    // Name and email can be added later
    if (!businessId || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId and serviceId are required' },
        { status: 400, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
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
        .select('name, price, base_price')
        .eq('id', serviceId)
        .eq('business_id', businessId)
        .single()

      if (service) {
        finalServiceName = service.name
        finalServicePrice = service.base_price || service.price || 0
      }
    }

    // Check lead limit based on billing plan
    const { data: business } = await supabase
      .from('businesses')
      .select('billing_plan, modules')
      .eq('id', businessId)
      .single()

    let limitWarning = null
    if (business) {
      const isProPlan = business.billing_plan === 'pro'

      if (!isProPlan) {
        // Free plan: cap at 20 leads
        const FREE_LEAD_LIMIT = 20
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
        const currentCount = count || 0
        if (currentCount >= FREE_LEAD_LIMIT) {
          limitWarning = `Lead limit reached (${FREE_LEAD_LIMIT} leads on Free plan). This lead was created but you may want to upgrade to Pro for unlimited leads.`
        }
      }
    }

    let score = 0
    if (finalServicePrice) {
      if (finalServicePrice >= 1000) score += 25
      else if (finalServicePrice >= 500) score += 15
      else if (finalServicePrice >= 100) score += 5
    }
    score += 20 // Created today = hot
    // Only add email score if we have a real email (not temp placeholder)
    const finalEmail = email ? email.trim() : `pending-${Date.now()}@temp.booking`
    if (finalEmail && !finalEmail.includes('@temp.booking')) {
      score += 5 // Has real email
    }

    const calculatedScore = score >= 50 ? 'hot' : score >= 25 ? 'warm' : 'cold'

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone)
    // Create lead with minimal info
    // Note: sms_consent column may not exist yet - handle gracefully
    const leadInsertData: any = {
      business_id: businessId,
      name: name ? name.trim() : 'Pending', // Will be updated when contact info is provided
      email: email ? email.trim() : `pending-${Date.now()}@temp.booking`, // Temporary, will be updated
      phone: normalizedPhone,
      source: 'online_booking',
      interested_in_service_id: serviceId,
      interested_in_service_name: finalServiceName,
      estimated_value: finalServicePrice,
      status: 'new',
      booking_progress: booking_progress || 1, // Step 1: Service selected (at beginning)
      abandoned_at_step: null,
      follow_up_count: 0,
      score: calculatedScore,
    }

    // Only add sms_consent if column exists (check by trying to insert with it)
    // If column doesn't exist, the insert will still work without it
    if (smsConsent !== undefined) {
      leadInsertData.sms_consent = smsConsent
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

      // If error is about sms_consent column not existing, retry without it
      // Check for PostgREST error (PGRST204) or PostgreSQL error (42703) or message contains sms_consent
      const isSmsConsentError =
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        error.message?.includes('sms_consent') ||
        error.message?.includes("Could not find the 'sms_consent' column")

      if (isSmsConsentError) {
        console.log('sms_consent column not found, retrying without it...')
        const leadInsertDataWithoutConsent = { ...leadInsertData }
        delete leadInsertDataWithoutConsent.sms_consent

        const { data: leadRetry, error: retryError } = await supabase
          .from('leads')
          .insert(leadInsertDataWithoutConsent)
          .select()
          .single()

        if (retryError) {
          return NextResponse.json(
            {
              error: retryError.message || 'Failed to create lead',
              details: {
                message: retryError.message,
                hint: retryError.hint,
                code: retryError.code,
                details: retryError.details
              }
            },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json({
          lead: leadRetry,
          warning: limitWarning || 'Note: SMS consent column not found in database. Please run the migration: database/add_sms_consent_to_leads.sql'
        }, { headers: corsHeaders })
      }

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
        { status: 500, headers: corsHeaders }
      )
    }

    // Check and enroll in sequences if applicable
    try {
      const { checkAndEnrollSequences } = await import('@/lib/actions/sequences')
      // Check for "booking_abandoned" sequences if booking was abandoned
      if (booking_progress < 100) {
        await checkAndEnrollSequences(lead.id, 'booking_abandoned')
      }
    } catch (error) {
      // Don't fail lead creation if sequence enrollment fails
      console.error('Error enrolling lead in sequences:', error)
    }

    return NextResponse.json({
      lead,
      warning: limitWarning || undefined
    }, { headers: corsHeaders })
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
      { status: 500, headers: corsHeaders }
    )
  }
}

