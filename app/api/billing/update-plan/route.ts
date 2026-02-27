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

  const { businessId, newPlan } = await request.json()

  if (!businessId || !newPlan) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (newPlan !== 'free' && newPlan !== 'pro') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, billing_plan, billing_interval')
      .eq('id', businessId)
      .single()

    if (!business?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Get current subscription items
    const { data: billingItems } = await supabase
      .from('billing_items')
      .select('*')
      .eq('business_id', businessId)

    const proItem = billingItems?.find((i: { module: string }) => i.module === 'pro')

    if (newPlan === 'pro') {
      // Upgrading to Pro — add Pro price ID
      const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY_V1
      if (!proPriceId) {
        return NextResponse.json({ error: 'Pro price ID not configured' }, { status: 500 })
      }

      if (proItem) {
        return NextResponse.json({ message: 'Already on Pro' })
      }

      const item = await stripe.subscriptionItems.create({
        subscription: business.stripe_subscription_id,
        price: proPriceId,
        quantity: 1,
      })

      // Save to billing_items
      await supabase.from('billing_items').insert({
        business_id: businessId,
        module: 'pro',
        stripe_price_id: proPriceId,
        stripe_subscription_item_id: item.id,
      })

      // Update business
      await supabase
        .from('businesses')
        .update({
          billing_plan: 'pro',
          subscription_plan: 'pro', // legacy
        })
        .eq('id', businessId)

    } else {
      // Downgrading to Free — remove Pro item at period end
      if (!proItem) {
        return NextResponse.json({ message: 'Already on Free' })
      }

      // Remove Pro item at end of billing period (no proration)
      await stripe.subscriptions.update(business.stripe_subscription_id, {
        items: [{
          id: proItem.stripe_subscription_item_id,
          deleted: true,
        }],
        proration_behavior: 'none',
      })

      await supabase
        .from('billing_items')
        .delete()
        .eq('business_id', businessId)
        .eq('module', 'pro')

      await supabase
        .from('businesses')
        .update({
          billing_plan: 'free',
          subscription_plan: 'starter', // legacy
        })
        .eq('id', businessId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
