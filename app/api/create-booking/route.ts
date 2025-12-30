import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
      notes,
      assetDetails,
      address,
      city,
      state,
      zip,
    } = body

    if (!businessId || !service || !customer || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Combine date and time
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`)

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
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        business_id: businessId,
        client_id: clientId,
        title: service.name,
        description: notes || null,
        service_type: service.name,
        scheduled_date: dateTime.toISOString(),
        estimated_duration: service.duration_minutes || 60,
        estimated_cost: service.price,
        status: 'scheduled',
        priority: 'medium',
        client_notes: notes || null,
        asset_details: assetDetails || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
      })
      .select()
      .single()

    if (jobError || !job) {
      throw new Error('Failed to create job')
    }

    // 3. Create invoice (marked as paid if real payment, unpaid if mock)
    const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        client_id: clientId,
        total: service.price,
        paid_amount: mockMode ? 0 : service.price,
        status: mockMode ? 'unpaid' : 'paid',
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
          price: service.price,
          quantity: 1,
        })

      // If paid, record payment
      if (!mockMode) {
        await supabase
          .from('payments')
          .insert({
            business_id: businessId,
            invoice_id: invoice.id,
            amount: service.price,
            payment_method: 'stripe',
            reference_number: 'online_booking',
          })
      }
    }

    // 4. Update lead if provided, otherwise create new one
    let leadIdFinal = leadId
    if (leadId) {
      // Update existing lead to converted status
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          booking_progress: 100,
          phone: customer.phone || null,
          notes: notes || null,
        })
        .eq('id', leadId)

      if (leadUpdateError) {
        console.error('Error updating lead:', leadUpdateError)
        // Don't fail the booking if lead update fails
      }
    } else {
      // Create new lead if not provided (fallback for old flow)
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          business_id: businessId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
          status: 'converted',
          converted_at: new Date().toISOString(),
          estimated_value: service.price,
          interested_in_service_name: service.name,
          source: 'online_booking',
          booking_progress: 100,
        })
        .select()
        .single()

      if (leadError) {
        console.error('Error creating lead:', leadError)
        // Don't fail the booking if lead creation fails
      } else {
        leadIdFinal = lead?.id
      }
    }

    // 5. Send confirmation emails
    // We need to fetch business details for the email
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email, phone')
      .eq('id', businessId)
      .single()

    if (business) {
      await sendBookingConfirmation({
        business: {
          name: business.name,
          email: business.email,
          phone: business.phone
        },
        service: {
          name: service.name
        },
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        scheduledDate,
        scheduledTime
      })
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
