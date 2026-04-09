import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, stripeAccountId, businessId, bookingData, holdAmount } = body

    if (!amount || !stripeAccountId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('billing_plan')
      .eq('id', businessId)
      .single()

    const billingPlan = business?.billing_plan ?? null
    const platformFee =
      billingPlan === 'pro'
        ? Math.round(amount * 0.029 + 30) // Pro: 2.9% + $0.30
        : Math.round(amount * 0.035 + 30) // Free: 3.5% + $0.30
    console.log(`[create-payment-intent] plan: ${billingPlan}, fee: ${platformFee}`)

    // Destination charge on platform; funds transfer to connected account; application_fee_amount is platform share

    const holdAmountCents = holdAmount && holdAmount > 0 ? Math.round(Number(holdAmount) * 100) : 0
    const usingHold = holdAmountCents > 0
    const intentAmount = usingHold ? holdAmountCents : Math.round(amount)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: intentAmount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      ...(usingHold ? { capture_method: 'manual' as const } : {}),
      application_fee_amount: platformFee,
      transfer_data: { destination: stripeAccountId },
      metadata: {
        business_id: businessId,
        stripe_account_id: stripeAccountId,
        ...(usingHold ? { is_hold: 'true', full_amount: String(Math.round(amount)) } : {}),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    const stripeError = error?.raw ?? error
    const rawMessage = error?.message ?? stripeError?.message ?? 'Failed to create payment intent'
    const isTransfersNotEnabled =
      typeof rawMessage === 'string' &&
      (rawMessage.includes('stripe_transfers') || rawMessage.includes('destination account'))
    const message = isTransfersNotEnabled
      ? 'This business’s Stripe account cannot receive payments yet. The business owner should open Dashboard → Settings → Payments, click “Manage Stripe Account”, and complete Stripe Connect onboarding. After onboarding, transfers will be enabled.'
      : rawMessage
    console.error('[create-payment-intent] Error:', {
      message: rawMessage,
      type: stripeError?.type,
      code: stripeError?.code,
      full: String(error),
    })
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
