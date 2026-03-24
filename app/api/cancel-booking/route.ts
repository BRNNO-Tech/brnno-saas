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
      return NextResponse.json({ error: 'Server is not configured for Stripe cancellation policy' }, { status: 500 })
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, business_id, scheduled_date, cancelled_at, stripe_payment_intent_id, payment_captured')
      .eq('id', jobId)
      .eq('business_id', businessId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.cancelled_at) {
      return NextResponse.json({ success: true, alreadyCancelled: true })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('cancellation_policy')
      .eq('id', businessId)
      .single()

    const nowIso = new Date().toISOString()
    await supabase.from('jobs').update({ status: 'cancelled', cancelled_at: nowIso }).eq('id', jobId)

    if (!job.stripe_payment_intent_id || job.payment_captured) {
      return NextResponse.json({ success: true, chargedAmount: 0, holdReleased: true })
    }

    const policy = (business?.cancellation_policy || null) as CancellationPolicy | null
    const chargeAmount =
      policy && job.scheduled_date
        ? evaluateCancellationFee(policy, job.scheduled_date, nowIso)
        : 0
    const chargeCents = Math.max(0, Math.round(chargeAmount * 100))

    if (chargeCents > 0) {
      const captured = await stripe.paymentIntents.capture(job.stripe_payment_intent_id, {
        amount_to_capture: chargeCents,
      })

      await supabase
        .from('jobs')
        .update({ payment_captured: true })
        .eq('id', jobId)

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle()

      if (invoice?.id) {
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_amount: chargeAmount })
          .eq('id', invoice.id)

        await supabase.from('payments').insert({
          business_id: businessId,
          invoice_id: invoice.id,
          amount: chargeAmount,
          payment_method: 'stripe',
          reference_number: captured.id,
        })
      }

      return NextResponse.json({ success: true, chargedAmount: chargeAmount, holdReleased: false })
    }

    await stripe.paymentIntents.cancel(job.stripe_payment_intent_id)
    return NextResponse.json({ success: true, chargedAmount: 0, holdReleased: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to cancel booking' }, { status: 500 })
  }
}
