import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getInitialConditionConfig } from '@/lib/utils/default-settings'
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

        // Handle addon subscriptions (both addon_key and addon_id formats)
        if (session.mode === 'subscription' && (session.metadata?.addon_key || session.metadata?.addon_id)) {
          const addonKey = session.metadata?.addon_key
          const addonId = session.metadata?.addon_id
          const businessId = session.metadata?.business_id
          const userId = session.metadata?.user_id

          // Map addon_id to addon_key if needed
          let finalAddonKey = addonKey
          if (!finalAddonKey && addonId) {
            // Map common addon IDs to keys
            if (addonId === 'ai_photo_analysis') {
              finalAddonKey = 'ai_photo_analysis'
            } else {
              finalAddonKey = addonId // Use addon_id as key if no mapping
            }
          }

          if (!businessId || !finalAddonKey) {
            console.error('Missing business_id or addon_key/addon_id in add-on checkout metadata')
            break
          }

          // Get subscription to find the subscription item ID
          const subscriptionId = session.subscription as string
          if (!subscriptionId) {
            console.error('No subscription ID in checkout session')
            break
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Get the subscription item (for standalone addon subscriptions, there should be one item)
          const subscriptionItem = subscription.items.data[0]

          if (subscriptionItem) {
            // Import the createSubscriptionAddon function
            const { createSubscriptionAddon } = await import('@/lib/actions/subscription-addons')
            
            try {
              await createSubscriptionAddon(
                businessId,
                finalAddonKey,
                subscriptionItem.id
              )
              console.log(`Created subscription add-on ${finalAddonKey} for business ${businessId}`)

              // Optionally update business.features array if the column exists
              try {
                const { data: business } = await supabase
                  .from('businesses')
                  .select('features')
                  .eq('id', businessId)
                  .single()

                if (business && Array.isArray(business.features)) {
                  const addonIdToAdd = addonId || finalAddonKey
                  if (!business.features.includes(addonIdToAdd)) {
                    await supabase
                      .from('businesses')
                      .update({
                        features: [...business.features, addonIdToAdd]
                      })
                      .eq('id', businessId)
                  }
                }
              } catch (featuresError) {
                // Features column may not exist, ignore error
                console.log('Could not update business.features (column may not exist)')
              }
            } catch (error: any) {
              console.error(`Error creating subscription add-on:`, error)
            }
          }
          break
        }

        // Main subscription (signup) checkout
        // Plan comes from metadata.plan_id (set by create-subscription-checkout). We never derive plan from
        // Stripe price ID, so grandfathered/legacy price IDs tied to existing accounts remain valid.
        if (session.mode === 'subscription' && session.metadata?.user_id && !session.metadata?.addon_key) {
          const userId = session.metadata.user_id
          const planId = session.metadata.plan_id
          const billingPeriod = session.metadata.billing_period
          const businessName = session.metadata.business_name || ''
          const teamSize = session.metadata.team_size ? parseInt(session.metadata.team_size) : 1
          const signupLeadId = session.metadata.signup_lead_id

          // Parse signup data from metadata
          let signupData: any = {}
          if (session.metadata.signup_data) {
            try {
              signupData = JSON.parse(session.metadata.signup_data)
            } catch (e) {
              console.error('Error parsing signup data:', e)
            }
          }

          // Mark signup lead as converted if we have a lead ID
          if (signupLeadId) {
            const { error: leadUpdateError } = await supabase
              .from('signup_leads')
              .update({
                converted: true,
                converted_at: new Date().toISOString(),
              })
              .eq('id', signupLeadId)

            if (leadUpdateError) {
              console.error('Error updating signup lead:', leadUpdateError)
              // Don't throw - this is not critical for the main flow
            } else {
              console.log(`Marked signup lead ${signupLeadId} as converted`)
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
            // Get smart condition config based on business location (state)
            const conditionConfig = getInitialConditionConfig(signupData.state || null)
            
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
                subscription_ends_at: new Date((subscription as any).current_period_end * 1000).toISOString(),
                team_size: teamSize,
                condition_config: conditionConfig, // Smart onboarding: region-specific defaults
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
                subscription_ends_at: new Date((subscription as any).current_period_end * 1000).toISOString(),
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
        const addonId = subscription.metadata?.addon_id
        const businessId = subscription.metadata?.business_id

        // Only update status and period end; we do NOT overwrite subscription_plan from Stripe price.
        // Accounts on grandfathered/legacy price IDs keep their existing subscription_plan in the DB.
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            subscription_status: subscription.status,
            subscription_ends_at: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        }

        // Handle addon subscription updates (standalone addon subscriptions)
        if (addonId && businessId) {
          // Map addon_id to addon_key
          const addonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
          
          const { updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          
          // Map Stripe status to our status
          let status: 'active' | 'canceled' | 'past_due' | 'trial' = 'active'
          if (subscription.status === 'canceled') {
            status = 'canceled'
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            status = 'past_due'
          } else if (subscription.status === 'trialing') {
            status = 'trial'
          }

          await updateSubscriptionAddonStatus(
            businessId,
            addonKey,
            status,
            subscription.status === 'canceled' ? new Date().toISOString() : undefined
          )

          // Update business.features if canceled
          if (subscription.status === 'canceled') {
            try {
              const { data: business } = await supabase
                .from('businesses')
                .select('features')
                .eq('id', businessId)
                .single()

              if (business && Array.isArray(business.features)) {
                const updatedFeatures = business.features.filter((f: string) => f !== addonId)
                await supabase
                  .from('businesses')
                  .update({ features: updatedFeatures })
                  .eq('id', businessId)
              }
            } catch (featuresError) {
              // Features column may not exist, ignore error
              console.log('Could not update business.features (column may not exist)')
            }
          }
        } else {
          // Handle subscription add-ons attached to main subscription
          // Check if items were added or removed
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (business) {
            const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
            const activeAddons = await getBusinessSubscriptionAddons(business.id)

            // Get all subscription item IDs from Stripe
            const stripeItemIds = subscription.items.data.map(item => item.id)

            // Check each active add-on to see if it still exists in Stripe
            for (const addon of activeAddons) {
              if (addon.stripe_subscription_item_id && !stripeItemIds.includes(addon.stripe_subscription_item_id)) {
                // Add-on was removed from subscription
                await updateSubscriptionAddonStatus(
                  business.id,
                  addon.addon_key,
                  'canceled',
                  new Date().toISOString()
                )
                console.log(`Removed subscription add-on ${addon.addon_key} for business ${business.id}`)
              } else if (addon.status !== subscription.status && subscription.status === 'active') {
                // Subscription status changed to active, update add-on status
                await updateSubscriptionAddonStatus(
                  business.id,
                  addon.addon_key,
                  'active'
                )
              } else if (subscription.status === 'past_due' && addon.status !== 'past_due') {
                // Subscription is past due, update add-on status
                await updateSubscriptionAddonStatus(
                  business.id,
                  addon.addon_key,
                  'past_due'
                )
              }
            }
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const addonId = subscription.metadata?.addon_id
        const businessId = subscription.metadata?.business_id

        // Mark main subscription as canceled (if this is the main subscription)
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error canceling subscription:', updateError)
        }

        // Handle addon subscription deletion (standalone addon subscriptions)
        if (addonId && businessId) {
          // Map addon_id to addon_key
          const addonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
          
          const { updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          
          await updateSubscriptionAddonStatus(
            businessId,
            addonKey,
            'canceled',
            new Date().toISOString()
          )

          // Remove from business.features
          try {
            const { data: business } = await supabase
              .from('businesses')
              .select('features')
              .eq('id', businessId)
              .single()

            if (business && Array.isArray(business.features)) {
              const updatedFeatures = business.features.filter((f: string) => f !== addonId)
              await supabase
                .from('businesses')
                .update({ features: updatedFeatures })
                .eq('id', businessId)
            }
          } catch (featuresError) {
            // Features column may not exist, ignore error
            console.log('Could not update business.features (column may not exist)')
          }
        } else {
          // Cancel all subscription add-ons for this business (main subscription deleted)
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (business) {
            const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
            const activeAddons = await getBusinessSubscriptionAddons(business.id)

            for (const addon of activeAddons) {
              await updateSubscriptionAddonStatus(
                business.id,
                addon.addon_key,
                'canceled',
                new Date().toISOString()
              )
            }
            console.log(`Canceled all subscription add-ons for business ${business.id}`)
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Handle add-on renewals
        // subscription can be a string (ID) or Stripe.Subscription object
        // Access via bracket notation to avoid TypeScript errors
        const subscription = (invoice as any).subscription
        const subscriptionId = typeof subscription === 'string' 
          ? subscription 
          : subscription?.id || null

        if (subscriptionId) {
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (business) {
            // Check if this invoice includes add-on items
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            
            // Update add-on statuses to active if payment succeeded
            const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
            const activeAddons = await getBusinessSubscriptionAddons(business.id)

            for (const addon of activeAddons) {
              if (addon.status === 'past_due') {
                await updateSubscriptionAddonStatus(
                  business.id,
                  addon.addon_key,
                  'active'
                )
              }
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Mark add-ons as past_due if payment failed
        // subscription can be a string (ID) or Stripe.Subscription object
        // Access via bracket notation to avoid TypeScript errors
        const subscription = (invoice as any).subscription
        const subscriptionId = typeof subscription === 'string' 
          ? subscription 
          : subscription?.id || null

        if (subscriptionId) {
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (business) {
            const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
            const activeAddons = await getBusinessSubscriptionAddons(business.id)

            for (const addon of activeAddons) {
              if (addon.status === 'active') {
                await updateSubscriptionAddonStatus(
                  business.id,
                  addon.addon_key,
                  'past_due'
                )
              }
            }
          }
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

