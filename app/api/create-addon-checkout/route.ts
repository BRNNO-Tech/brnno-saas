import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from '@/lib/actions/utils'
import { getSubscriptionAddon } from '@/lib/subscription-addons/definitions'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
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
    const { addonKey, billingPeriod } = body

    if (!addonKey || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: addonKey and billingPeriod' },
        { status: 400 }
      )
    }

    // Get the add-on definition
    const addon = getSubscriptionAddon(addonKey)
    if (!addon) {
      return NextResponse.json(
        { error: 'Invalid add-on key' },
        { status: 400 }
      )
    }

    // Type guard for billing period
    const period: 'monthly' | 'yearly' = billingPeriod === 'monthly' || billingPeriod === 'yearly' 
      ? billingPeriod 
      : 'monthly'

    // Get the correct price ID
    const priceId = period === 'monthly' 
      ? addon.stripeMonthlyPriceId 
      : addon.stripeYearlyPriceId

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${addon.name} (${period})` },
        { status: 400 }
      )
    }

    // Get business and user info
    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id, stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    let customerId = business.stripe_customer_id

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.user.email || undefined,
        name: business.name || undefined,
        metadata: {
          business_id: business.id,
          user_id: user.user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to business
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business.id)
    }

    // Check if business has an active subscription
    const { data: existingSubscription } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', businessId)
      .single()

    if (!existingSubscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'You must have an active subscription to add add-ons' },
        { status: 400 }
      )
    }

    // Check if subscription is active or trialing
    if (existingSubscription.subscription_status !== 'active' && existingSubscription.subscription_status !== 'trialing') {
      return NextResponse.json(
        { error: 'Your subscription must be active to add add-ons' },
        { status: 400 }
      )
    }

    // Retrieve the existing subscription
    const subscription = await stripe.subscriptions.retrieve(
      existingSubscription.stripe_subscription_id
    )

    // Create checkout session that will add the subscription item
    // We'll use checkout mode 'setup' or add it directly to the subscription
    // For simplicity, we'll add it directly to the subscription
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscription.id,
      price: priceId,
    })

    // Create the add-on record in our database
    const { createSubscriptionAddon } = await import('@/lib/actions/subscription-addons')
    await createSubscriptionAddon(businessId, addonKey, subscriptionItem.id)

    // Redirect to success page
    const origin = request.headers.get('origin') || ''
    return NextResponse.json({ 
      success: true,
      redirectUrl: `${origin}/dashboard/settings/subscription?success=true&addon=${addonKey}`
    })
  } catch (error: any) {
    console.error('Error creating add-on checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
