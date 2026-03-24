import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { CancellationPolicy } from '@/types/cancellation-policy'
import { evaluateCancellationFee } from '@/lib/utils/cancellation-policy'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function POST(request: NextRequest) {
  try {
    const { jobId, businessId } = await request.json()
    if (!jobId || !businessId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Server is not configured for Stripe no-show policy' }, { status: 500 })
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, business_id, scheduled_date, stripe_payment_intent_id, payment_captured')
      .eq('id', jobId)
      .eq('business_id', businessId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'No Stripe hold found for this job' }, { status: 400 })
    }
    if (job.payment_captured) {
      return NextResponse.json({ success: true, alreadyCaptured: true })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('cancellation_policy')
      .eq('id', businessId)
      .single()

    const policy = (business?.cancellation_policy || null) as CancellationPolicy | null
    const nowIso = new Date().toISOString()
    const ruleFee =
      policy && job.scheduled_date
        ? evaluateCancellationFee(policy, job.scheduled_date, nowIso)
        : 0
    const configuredNoShow = Math.max(0, Number(policy?.noshow_charge || 0))
    const captureAmount = Math.max(configuredNoShow, ruleFee)
    const captureCents = Math.round(captureAmount * 100)
    if (captureCents <= 0) {
      return NextResponse.json({ error: 'No-show charge is not configured' }, { status: 400 })
    }

    const captured = await stripe.paymentIntents.capture(job.stripe_payment_intent_id, {
      amount_to_capture: captureCents,
    })

    await supabase
      .from('jobs')
      .update({ status: 'no_show', payment_captured: true, cancelled_at: nowIso })
      .eq('id', jobId)

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle()

    if (invoice?.id) {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_amount: captureAmount })
        .eq('id', invoice.id)

      await supabase.from('payments').insert({
        business_id: businessId,
        invoice_id: invoice.id,
        amount: captureAmount,
        payment_method: 'stripe',
        reference_number: captured.id,
      })
    }

    return NextResponse.json({ success: true, chargedAmount: captureAmount })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to mark booking as no-show' }, { status: 500 })
  }
}
