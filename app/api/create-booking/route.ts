import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      leadId,
      service,
      customer,
      scheduledDate,
      scheduledTime,
      timezoneOffset, // Timezone offset in minutes from UTC (e.g., -480 for PST)
      notes,
      assetDetails,
      address,
      city,
      state,
      zip,
      discountCode,
      discountPercent,
    } = body

    if (!businessId || !service || !customer || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for public booking flow
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

    // Combine date and time
    // The date and time come from the client in the user's local timezone
    // We have the timezone offset from the client, so we can convert correctly to UTC
    // Parse the date and time components
    const [year, month, day] = scheduledDate.split('-').map(Number)
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    
    // Create date in UTC using the user's local time
    // timezoneOffset is in minutes from UTC (getTimezoneOffset returns positive for behind UTC)
    // For example: PST (UTC-8) has offset 480, EST (UTC-5) has offset 300
    // To convert local time to UTC, we ADD the offset (since offset is positive for behind UTC)
    const offsetMinutes = timezoneOffset || 0
    const dateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes + offsetMinutes, 0))
    
    // Validate the date
    if (isNaN(dateTime.getTime())) {
      throw new Error('Invalid date or time provided')
    }
    
    console.log('[create-booking] Date/time processing:', {
      scheduledDate,
      scheduledTime,
      timezoneOffset,
      constructedUTC: dateTime.toISOString(),
      localString: dateTime.toString()
    })

    // 1. Find or create client
    let clientId: string

    // Check if client exists by email
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', customer.email)
      .single()

    if (existingClient) {
      clientId = existingClient.id

      // Update client info if provided
      await supabase
        .from('clients')
        .update({
          name: customer.name,
          phone: customer.phone || null,
        })
        .eq('id', clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
        })
        .select()
        .single()

      if (clientError || !newClient) {
        throw new Error('Failed to create client')
      }

      clientId = newClient.id
    }

    // 2. Create job
    console.log('[create-booking] Creating job for business:', businessId)
    // Use the calculated duration from booking form (includes add-ons)
    // The booking form already calculates: base duration + add-on durations
    const calculatedDuration = service.duration_minutes || 60
    
    const jobData: any = {
      business_id: businessId,
      client_id: clientId,
      title: service.name,
      description: notes || null,
      service_type: service.name,
      scheduled_date: dateTime.toISOString(),
      estimated_duration: calculatedDuration, // This includes add-ons from booking form calculation
      estimated_cost: finalPrice, // This includes add-ons and discount from booking form calculation
      status: 'scheduled',
      priority: 'medium',
      client_notes: notes || null,
      asset_details: assetDetails || null,
      addons: body.addons || [], // Store add-ons array in job record
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
    }

    // Add lead_id if provided (for linking booking photos)
    if (leadId) {
      jobData.lead_id = leadId
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()

    if (jobError) {
      console.error('[create-booking] Job creation error:', jobError)
      throw new Error(`Failed to create job: ${jobError.message}`)
    }
    
    if (!job) {
      console.error('[create-booking] Job creation returned no data')
      throw new Error('Failed to create job: No data returned')
    }
    
    console.log('[create-booking] Job created successfully:', job.id)

    // 3. Apply discount if discount code was used
    let finalPrice = service.price
    if (discountCode && discountPercent) {
      const discountAmount = (service.price * discountPercent) / 100
      finalPrice = Math.max(0, service.price - discountAmount)
      
      // Increment discount code usage count
      if (discountCode) {
        await supabase.rpc('increment_discount_code_usage', {
          p_business_id: businessId,
          p_code: discountCode.toUpperCase()
        }).catch(async () => {
          // Fallback if RPC doesn't exist - use direct update
          const { data: codeData } = await supabase
            .from('discount_codes')
            .select('usage_count')
            .eq('business_id', businessId)
            .eq('code', discountCode.toUpperCase())
            .single()
          
          if (codeData) {
            await supabase
              .from('discount_codes')
              .update({ usage_count: (codeData.usage_count || 0) + 1 })
              .eq('business_id', businessId)
              .eq('code', discountCode.toUpperCase())
          }
        })
      }
    }

    // 4. Create invoice (marked as paid if real payment, unpaid if mock)
    const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        client_id: clientId,
        total: finalPrice,
        paid_amount: mockMode ? 0 : finalPrice,
        status: mockMode ? 'unpaid' : 'paid',
        discount_code: discountCode || null,
        discount_amount: discountCode && discountPercent ? (service.price * discountPercent) / 100 : null,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      // Don't fail the booking if invoice creation fails
    } else if (invoice) {
      // Create invoice item
      await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          service_id: service.id,
          name: service.name,
          description: service.description || null,
          price: service.price, // Store original price in invoice item
          quantity: 1,
        })

      // If paid, record payment
      if (!mockMode) {
        await supabase
          .from('payments')
          .insert({
            business_id: businessId,
            invoice_id: invoice.id,
            amount: finalPrice,
            payment_method: 'stripe',
            reference_number: 'online_booking',
          })
      }
    }

    // 5. Update existing lead or create new one if booking completes
    // If leadId is provided, update the existing lead instead of creating a duplicate
    let leadIdFinal: string | null = leadId || null
    
    try {
      if (leadId) {
        // Update existing lead from booking flow
        const { data: updatedLead, error: updateError } = await supabase
          .from('leads')
          .update({
            status: 'booked',
            job_id: job.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || null,
            estimated_value: finalPrice,
            interested_in_service_name: service.name,
            notes: notes || null,
            booking_progress: 100, // Mark as fully completed
            abandoned_at_step: null, // Clear abandonment if it was set
          })
          .eq('id', leadId)
          .eq('business_id', businessId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating existing lead:', updateError)
          // Fall through to create new lead if update fails
          leadIdFinal = null
        } else {
          leadIdFinal = updatedLead?.id || leadId
        }
      }

      // If no leadId or update failed, create a new lead
      if (!leadIdFinal) {
        const { data: bookingLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            business_id: businessId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || null,
            status: 'booked',
            source: 'booking',
            job_id: job.id,
            estimated_value: finalPrice,
            interested_in_service_name: service.name,
            notes: notes || null,
            booking_progress: 100,
          })
          .select()
          .single()

        if (leadError) {
          console.error('Error creating booking lead:', leadError)
          // Don't fail the booking if lead creation fails - this is silent
        } else {
          leadIdFinal = bookingLead?.id || null
        }
      }

      // Auto-link booking photos to the job if we have a lead_id
      if (leadIdFinal) {
        await supabase
          .from('booking_photos')
          .update({ job_id: job.id })
          .eq('lead_id', leadIdFinal)
          .is('job_id', null)
      }
    } catch (error) {
      console.error('Error in booking lead creation/update:', error)
      // Silent failure - booking still succeeds
    }

    // 5. Send confirmation emails and SMS
    // We need to fetch business details for the notifications
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email, phone')
      .eq('id', businessId)
      .single()

    console.log('[create-booking] Email sending check:', {
      hasBusiness: !!business,
      businessEmail: business?.email || 'MISSING',
      customerEmail: customer.email || 'MISSING',
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'not set'
    })

    // Prepare bookingData for both email and SMS (needed outside conditional blocks)
    const bookingData = business ? {
      business: {
        name: business.name,
        email: business.email,
        phone: business.phone
      },
      service: {
        name: service.name,
        price: body.totalPrice || service.price || 0,
        duration_minutes: service.duration_minutes || service.base_duration || service.estimated_duration || 60
      },
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      scheduledDate,
      scheduledTime,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      assetDetails: assetDetails || null,
      notes: notes || null
    } : null

    if (business && bookingData) {
      // Check if business email exists
      if (!business.email) {
        console.error('❌ Business email is missing. Cannot send booking confirmation emails.')
        console.error('Business ID:', businessId, 'Business Name:', business.name)
      } else if (!customer.email) {
        console.error('❌ Customer email is missing. Cannot send booking confirmation emails.')
        console.error('Customer Name:', customer.name)
      } else if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is not configured. Cannot send booking confirmation emails.')
        console.error('Please add RESEND_API_KEY to your .env.local file')
      } else {
        // Send email confirmation (existing)
        try {
          await sendBookingConfirmation(bookingData)
          console.log('✅ Booking confirmation email sent successfully')
          console.log('  - Customer email:', customer.email)
          console.log('  - Business email:', business.email)
        } catch (emailError: any) {
          console.error('❌ Failed to send booking confirmation email:', emailError)
          console.error('  - Error message:', emailError?.message)
          console.error('  - Customer email:', customer.email)
          console.error('  - Business email:', business.email)
          console.error('  - RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
          
          // Check if it's a domain verification error
          if (emailError?.message?.includes('verify a domain')) {
            console.error('  - ⚠️ RESEND DOMAIN VERIFICATION REQUIRED:')
            console.error('     You need to verify a domain in Resend and set RESEND_FROM_EMAIL to use that domain.')
            console.error('     Example: RESEND_FROM_EMAIL=noreply@yourdomain.com')
            console.error('     Visit: https://resend.com/domains to verify a domain')
          }
          // Don't fail the booking if email fails
        }
      }

      // Send SMS confirmation (new) - only if customer has phone
      // Note: SMS consent is required in the booking form, so we can safely send
      // The booking form requires SMS consent to proceed, so consent is implied
      if (customer.phone && bookingData) {
        try {
          const { sendBookingConfirmationSMS } = await import('@/lib/email')
          // Check if we can get SMS consent from the lead record (if it exists)
          let smsConsent = true // Default to true since form requires consent
          if (leadIdFinal) {
            try {
              const { data: lead } = await supabase
                .from('leads')
                .select('sms_consent')
                .eq('id', leadIdFinal)
                .single()
              if (lead && lead.sms_consent !== undefined) {
                smsConsent = lead.sms_consent
              }
            } catch (error) {
              // If we can't check, default to true (form requires consent)
              console.log('Could not verify SMS consent from lead, defaulting to true')
            }
          }
          await sendBookingConfirmationSMS(bookingData, smsConsent)
        } catch (smsError) {
          console.error('❌ Failed to send booking confirmation SMS:', smsError)
          // Don't fail the booking if SMS fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      invoiceId: invoice?.id,
      leadId: leadIdFinal,
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
