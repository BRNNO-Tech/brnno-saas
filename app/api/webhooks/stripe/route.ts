import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use service role client to bypass RLS
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle subscription checkouts
        if (session.mode === 'subscription' && session.metadata?.user_id) {
          const userId = session.metadata.user_id
          const planId = session.metadata.plan_id
          const billingPeriod = session.metadata.billing_period
          const businessName = session.metadata.business_name || ''
          const teamSize = session.metadata.team_size ? parseInt(session.metadata.team_size) : 1

          // Parse signup data from metadata
          let signupData: any = {}
          if (session.metadata.signup_data) {
            try {
              signupData = JSON.parse(session.metadata.signup_data)
            } catch (e) {
              console.error('Error parsing signup data:', e)
            }
          }

          // Get subscription details
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const customerId = subscription.customer as string

          // Check if business already exists
          const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', userId)
            .single()

          if (!existingBusiness) {
            // Create business record with all signup data
            const { error: businessError } = await supabase
              .from('businesses')
              .insert({
                owner_id: userId,
                name: signupData.businessName || businessName,
                email: session.customer_email || signupData.email || null,
                phone: signupData.phone || null,
                address: signupData.address || null,
                city: signupData.city || null,
                state: signupData.state || null,
                zip: signupData.zip || null,
                subdomain: signupData.subdomain || null,
                description: signupData.description || null,
                subscription_plan: planId,
                subscription_status: 'active',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                subscription_billing_period: billingPeriod,
                subscription_started_at: new Date().toISOString(),
                subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                team_size: teamSize,
              })

            if (businessError) {
              console.error('Error creating business:', businessError)
              throw new Error(`Failed to create business: ${businessError.message}`)
            }
          } else {
            // Update existing business with subscription info
            const { error: updateError } = await supabase
              .from('businesses')
              .update({
                subscription_plan: planId,
                subscription_status: 'active',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                subscription_billing_period: billingPeriod,
                subscription_started_at: new Date().toISOString(),
                subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('owner_id', userId)

            if (updateError) {
              console.error('Error updating business:', updateError)
              throw new Error(`Failed to update business: ${updateError.message}`)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            subscription_status: subscription.status,
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Mark subscription as canceled
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error canceling subscription:', updateError)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

