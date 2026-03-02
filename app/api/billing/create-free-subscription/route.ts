import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const { businessId, userId, email, businessName } = await request.json()

  if (!businessId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Check if business already has a subscription
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (business?.stripe_subscription_id) {
      return NextResponse.json({ message: 'Subscription already exists' })
    }

    // Get or create Stripe customer
    let customerId = business?.stripe_customer_id

    if (!customerId) {
      // Check stripe_customers table
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()

      if (stripeCustomer?.stripe_customer_id) {
        customerId = stripeCustomer.stripe_customer_id
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: email || undefined,
          name: businessName || undefined,
          metadata: { user_id: userId, business_id: businessId },
        })
        customerId = customer.id

        // Save to stripe_customers table
        await supabase
          .from('stripe_customers')
          .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' })
      }
    }

    // Create a free subscription with no items
    // This gives us a subscription to attach items to later
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [], // No items = $0/month free plan
      metadata: {
        business_id: businessId,
        user_id: userId,
        plan_id: 'free',
      },
    })

    // Update business with subscription info
    await supabase
      .from('businesses')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        subscription_status: 'active',
        subscription_plan: 'starter', // legacy
        billing_plan: 'free',
        billing_interval: 'monthly',
        subscription_started_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    return NextResponse.json({ success: true, subscriptionId: subscription.id })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
