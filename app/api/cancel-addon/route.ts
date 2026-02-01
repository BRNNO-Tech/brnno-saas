import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from '@/lib/actions/utils'
import { getBusinessSubscriptionAddon, cancelSubscriptionAddon } from '@/lib/actions/subscription-addons'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
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
    const { addonKey } = body

    if (!addonKey) {
      return NextResponse.json(
        { error: 'Missing addonKey' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Get the add-on record
    const addon = await getBusinessSubscriptionAddon(addonKey, businessId)

    if (!addon || !addon.stripe_subscription_item_id) {
      return NextResponse.json(
        { error: 'Add-on not found or not active' },
        { status: 404 }
      )
    }

    // Get business to find main subscription
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id')
      .eq('id', businessId)
      .single()

    if (!business?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Business subscription not found' },
        { status: 404 }
      )
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(business.stripe_subscription_id)

    // Find and delete the subscription item
    await stripe.subscriptionItems.del(addon.stripe_subscription_item_id)

    // Update our database record
    await cancelSubscriptionAddon(addonKey, businessId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error canceling add-on:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel add-on' },
      { status: 500 }
    )
  }
}
