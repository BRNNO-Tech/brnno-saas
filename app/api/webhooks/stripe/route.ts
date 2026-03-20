import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getInitialConditionConfig } from '@/lib/utils/default-settings'
import { createClient } from '@supabase/supabase-js'
import { syncStripeConnectAccountStatus } from '@/lib/actions/stripe-connect'
import { recordInvoicePaymentFromStripeSession } from '@/lib/invoices/record-invoice-payment'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Map your env price IDs to module keys (exact env variable names from .env)
const PRICE_ID_TO_MODULE: Record<string, string> = {
  [process.env.STRIPE_PRICE_PLATFORM_ACCESS_MONTHLY_V1 || '']: 'platformFee',
  [process.env.STRIPE_PRICE_PRO_MONTHLY_V1 || '']: 'pro',
  [process.env.STRIPE_PRICE_LEAD_RECOVERY_MONTHLY_V1 || '']: 'leadRecovery',
  [process.env.STRIPE_PRICE_LEAD_RECOVERY_ANNUAL_V1 || '']: 'leadRecovery',
  [process.env.STRIPE_PRICE_LEAD_RECOVERY_FOUNDERS_V1 || '']: 'leadRecovery',
  [process.env.STRIPE_PRICE_AI_AUTO_LEAD_MONTHLY_V1 || '']: 'leadRecoveryAi',
  [process.env.STRIPE_PRICE_AI_AUTO_LEAD_ANNUAL_V1 || '']: 'leadRecoveryAi',
  [process.env.STRIPE_PRICE_AI_AUTO_LEAD_FOUNDERS_V1 || '']: 'leadRecoveryAi',
  [process.env.STRIPE_PRICE_INVOICES_MONTHLY_V1 || '']: 'invoices',
  [process.env.STRIPE_PRICE_INVOICES_ANNUAL_V1 || '']: 'invoices',
  [process.env.STRIPE_PRICE_INVOICES_FOUNDERS_V1 || '']: 'invoices',
  [process.env.STRIPE_PRICE_QUICK_QUOTE_MONTHLY_V1 || '']: 'quickQuote',
  [process.env.STRIPE_PRICE_QUICK_QUOTE_ANNUAL_V1 || '']: 'quickQuote',
  [process.env.STRIPE_PRICE_QUICK_QUOTE_FOUNDERS_V1 || '']: 'quickQuote',
  [process.env.STRIPE_PRICE_PHOTOS_MONTHLY_V1 || '']: 'photos',
  [process.env.STRIPE_PRICE_PHOTOS_ANNUAL_V1 || '']: 'photos',
  [process.env.STRIPE_PRICE_PHOTOS_FOUNDERS_V1 || '']: 'photos',
  [process.env.STRIPE_PRICE_MILEAGE_TRACKER_MONTHLY_V1 || '']: 'mileage',
  [process.env.STRIPE_PRICE_MILEAGE_TRACKER_ANNUAL_V1 || '']: 'mileage',
  [process.env.STRIPE_PRICE_MILEAGE_TRACKER_FOUNDERS_V1 || '']: 'mileage',
  [process.env.STRIPE_PRICE_INVENTORY_MANAGEMENT_MONTHLY_V1 || '']: 'inventory',
  [process.env.STRIPE_PRICE_INVENTORY_MANAGEMENT_ANNUAL_V1 || '']: 'inventory',
  [process.env.STRIPE_PRICE_INVENTORY_MANAGEMENT_FOUNDERS_V1 || '']: 'inventory',
  [process.env.STRIPE_PRICE_TEAM_MANAGEMENT_MONTHLY_V1 || '']: 'teamManagement',
  [process.env.STRIPE_PRICE_TEAM_MANAGEMENT_ANNUAL_V1 || '']: 'teamManagement',
  [process.env.STRIPE_PRICE_TEAM_MANAGEMENT_FOUNDERS_V1 || '']: 'teamManagement',
  [process.env.STRIPE_AI_PHOTO_ANALYSIS_MONTHLY_PRICE_ID || '']: 'aiPhotoAnalysis',
}

// Build modules JSONB from active subscription items
function buildModulesFromItems(items: Stripe.SubscriptionItem[]): Record<string, unknown> {
  const modules: Record<string, unknown> = {
    leadRecovery: { enabled: false, ai: false },
    quickQuote: false,
    photos: false,
    mileage: false,
    inventory: false,
    invoices: false,
    teamManagement: false,
  }

  for (const item of items) {
    const module = PRICE_ID_TO_MODULE[item.price.id]
    if (!module || module === 'platformFee' || module === 'pro') continue

    if (module === 'leadRecoveryAi') {
      modules.leadRecovery = { enabled: true, ai: true }
    } else if (module === 'leadRecovery') {
      if (!(modules.leadRecovery as { ai: boolean }).ai) {
        modules.leadRecovery = { enabled: true, ai: false }
      }
    } else {
      modules[module] = true
    }
  }

  return modules
}

// Sync billing_items table with current subscription items
async function syncBillingItems(businessId: string, items: Stripe.SubscriptionItem[]) {
  if (!supabase) return
  await supabase
    .from('billing_items')
    .delete()
    .eq('business_id', businessId)

  const rows = items
    .map(item => ({
      business_id: businessId,
      module: PRICE_ID_TO_MODULE[item.price.id] || 'unknown',
      stripe_price_id: item.price.id,
      stripe_subscription_item_id: item.id,
    }))
    .filter(row => row.module !== 'unknown')

  if (rows.length > 0) {
    await supabase.from('billing_items').insert(rows)
  }
}

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
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // --- PUBLIC INVOICE CHECKOUT (one-time payment) ---
        if (session.mode === 'payment' && session.metadata?.invoiceId) {
          const invoiceId = String(session.metadata.invoiceId)
          const amountTotal = session.amount_total
          if (amountTotal == null) {
            console.error('checkout.session.completed: invoice payment missing amount_total')
            break
          }
          const amount = amountTotal / 100
          try {
            await recordInvoicePaymentFromStripeSession(invoiceId, amount, session.id)
          } catch (e) {
            console.error('Invoice payment webhook:', e)
          }
          break
        }

        // --- ADD-ON CHECKOUT (unchanged) ---
        if (session.mode === 'subscription' && (session.metadata?.addon_key || session.metadata?.addon_id)) {
          const addonKey = session.metadata?.addon_key
          const addonId = session.metadata?.addon_id
          const businessId = session.metadata?.business_id

          let finalAddonKey = addonKey
          if (!finalAddonKey && addonId) {
            finalAddonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
          }

          if (!businessId || !finalAddonKey) {
            console.error('Missing business_id or addon_key/addon_id in add-on checkout metadata')
            break
          }

          const subscriptionId = session.subscription as string
          if (!subscriptionId) break

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const subscriptionItem = subscription.items.data[0]

          if (subscriptionItem) {
            const { createSubscriptionAddon } = await import('@/lib/actions/subscription-addons')
            try {
              await createSubscriptionAddon(businessId, finalAddonKey, subscriptionItem.id)
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
                      .update({ features: [...business.features, addonIdToAdd] })
                      .eq('id', businessId)
                  }
                }
              } catch (featuresError) {
                console.log('Could not update business.features (column may not exist)')
              }
            } catch (error: unknown) {
              console.error('Error creating subscription add-on:', error)
            }
          }
          break
        }

        // --- MODULE-ONLY CHECKOUT (first-time module add, single or multiple modules) ---
        const hasModuleOnly =
          session.mode === 'subscription' &&
          session.metadata?.business_id &&
          session.metadata?.action === 'add' &&
          (session.metadata?.module || session.metadata?.modules)
        const moduleMeta = session.metadata
        if (hasModuleOnly && moduleMeta) {
          const businessId = moduleMeta.business_id as string
          const subscriptionId = session.subscription as string
          if (!subscriptionId) break
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const customerId = subscription.customer as string
          // Build modules from subscription line items (handles single and multiple)
          const modules = buildModulesFromItems(subscription.items.data)
          await syncBillingItems(businessId, subscription.items.data)
          await supabase
            .from('businesses')
            .update({
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              subscription_status: 'active',
              billing_plan: 'free',
              billing_interval: 'monthly',
              subscription_started_at: new Date().toISOString(),
              subscription_ends_at: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
              modules,
            })
            .eq('id', businessId)
          break
        }

        // --- MAIN SUBSCRIPTION CHECKOUT ---
        if (session.mode === 'subscription' && session.metadata?.user_id && !session.metadata?.addon_key) {
          const userId = session.metadata.user_id
          const planId = session.metadata.plan_id as string | undefined // 'free' | 'pro' or legacy
          const billingPeriod = session.metadata.billing_period as string | undefined
          const businessName = (session.metadata.business_name as string) || ''
          const teamSize = session.metadata.team_size ? parseInt(String(session.metadata.team_size)) : 1
          const signupLeadId = session.metadata.signup_lead_id as string | undefined

          let signupData: Record<string, unknown> = {}
          if (session.metadata.signup_data) {
            try {
              signupData = JSON.parse(String(session.metadata.signup_data)) as Record<string, unknown>
            } catch (e) {
              console.error('Error parsing signup data:', e)
            }
          }

          if (signupLeadId) {
            await supabase
              .from('signup_leads')
              .update({ converted: true, converted_at: new Date().toISOString() })
              .eq('id', signupLeadId)
          }

          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const customerId = subscription.customer as string

          const billingPlan = planId === 'pro' ? 'pro' : 'free'
          const legacyPlan = planId === 'pro' ? 'pro' : 'starter'

          const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', userId)
            .single()

          if (!existingBusiness) {
            const conditionConfig = getInitialConditionConfig((signupData.state as string) || null)
            await supabase.from('businesses').insert({
              owner_id: userId,
              name: (signupData.businessName as string) || businessName,
              email: (session.customer_email ?? signupData.email) as string | null,
              phone: (signupData.phone as string) || null,
              address: (signupData.address as string) || null,
              city: (signupData.city as string) || null,
              state: (signupData.state as string) || null,
              zip: (signupData.zip as string) || null,
              subdomain: (signupData.subdomain as string) || null,
              description: (signupData.description as string) || null,
              subscription_plan: legacyPlan,
              subscription_status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              subscription_billing_period: billingPeriod,
              subscription_started_at: new Date().toISOString(),
              subscription_ends_at: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
              team_size: teamSize,
              condition_config: conditionConfig,
              billing_plan: billingPlan,
              billing_interval: billingPeriod || 'monthly',
            })
          } else {
            await supabase
              .from('businesses')
              .update({
                subscription_plan: legacyPlan,
                subscription_status: 'active',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                subscription_billing_period: billingPeriod,
                subscription_started_at: new Date().toISOString(),
                subscription_ends_at: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
                billing_plan: billingPlan,
                billing_interval: billingPeriod || 'monthly',
              })
              .eq('owner_id', userId)
          }

          await supabase
            .from('stripe_customers')
            .upsert(
              { user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const addonId = subscription.metadata?.addon_id
        const businessId = subscription.metadata?.business_id

        const { data: business } = await supabase
          .from('businesses')
          .select('id, billing_plan')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (business) {
          const hasPro = subscription.items.data.some(item => PRICE_ID_TO_MODULE[item.price.id] === 'pro')
          const modules = buildModulesFromItems(subscription.items.data)
          const platformFeeItem = subscription.items.data.find(
            item => PRICE_ID_TO_MODULE[item.price.id] === 'platformFee'
          )

          await supabase
            .from('businesses')
            .update({
              subscription_status: subscription.status,
              subscription_ends_at: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
              billing_plan: hasPro ? 'pro' : 'free',
              modules,
              platform_fee_item_id: platformFeeItem?.id ?? null,
            })
            .eq('id', business.id)

          await syncBillingItems(business.id, subscription.items.data)
        }

        if (addonId && businessId) {
          const addonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
          const { updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          let status: 'active' | 'canceled' | 'past_due' | 'trial' = 'active'
          if (subscription.status === 'canceled') status = 'canceled'
          else if (subscription.status === 'past_due' || subscription.status === 'unpaid') status = 'past_due'
          else if (subscription.status === 'trialing') status = 'trial'

          await updateSubscriptionAddonStatus(
            businessId,
            addonKey,
            status,
            subscription.status === 'canceled' ? new Date().toISOString() : undefined
          )

          if (subscription.status === 'canceled') {
            try {
              const { data: biz } = await supabase
                .from('businesses')
                .select('features')
                .eq('id', businessId)
                .single()
              if (biz && Array.isArray(biz.features)) {
                await supabase
                  .from('businesses')
                  .update({ features: (biz.features as string[]).filter(f => f !== addonId) })
                  .eq('id', businessId)
              }
            } catch (e) {
              console.log('Could not update business.features')
            }
          }
        } else if (business) {
          const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          const activeAddons = await getBusinessSubscriptionAddons(business.id)
          const stripeItemIds = subscription.items.data.map(item => item.id)
          for (const addon of activeAddons) {
            if (addon.stripe_subscription_item_id && !stripeItemIds.includes(addon.stripe_subscription_item_id)) {
              await updateSubscriptionAddonStatus(business.id, addon.addon_key, 'canceled', new Date().toISOString())
            } else if (addon.status !== 'active' && subscription.status === 'active') {
              await updateSubscriptionAddonStatus(business.id, addon.addon_key, 'active')
            } else if (subscription.status === 'past_due' && addon.status !== 'past_due') {
              await updateSubscriptionAddonStatus(business.id, addon.addon_key, 'past_due')
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const addonId = subscription.metadata?.addon_id
        const businessId = subscription.metadata?.business_id

        const defaultModules = {
          leadRecovery: { enabled: false, ai: false },
          jobs: false,
          quickQuote: false,
          photos: false,
          mileage: false,
          inventory: false,
          teamManagement: false,
        }

        await supabase
          .from('businesses')
          .update({
            subscription_status: 'canceled',
            billing_plan: 'free',
            modules: defaultModules,
            platform_fee_item_id: null,
          })
          .eq('stripe_subscription_id', subscription.id)

        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (biz) {
          await supabase.from('billing_items').delete().eq('business_id', biz.id)
        }

        if (addonId && businessId) {
          const addonKey = addonId === 'ai_photo_analysis' ? 'ai_photo_analysis' : addonId
          const { updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          await updateSubscriptionAddonStatus(businessId, addonKey, 'canceled', new Date().toISOString())
          try {
            const { data: business } = await supabase
              .from('businesses')
              .select('features')
              .eq('id', businessId)
              .single()
            if (business && Array.isArray(business.features)) {
              await supabase
                .from('businesses')
                .update({ features: (business.features as string[]).filter(f => f !== addonId) })
                .eq('id', businessId)
            }
          } catch (e) {
            console.log('Could not update business.features')
          }
        } else if (biz) {
          const { getBusinessSubscriptionAddons, updateSubscriptionAddonStatus } = await import('@/lib/actions/subscription-addons')
          const activeAddons = await getBusinessSubscriptionAddons(biz.id)
          for (const addon of activeAddons) {
            await updateSubscriptionAddonStatus(biz.id, addon.addon_key, 'canceled', new Date().toISOString())
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = (invoice as Stripe.Invoice & { subscription?: string | { id: string } }).subscription
        const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id ?? null
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
              if (addon.status === 'past_due') {
                await updateSubscriptionAddonStatus(business.id, addon.addon_key, 'active')
              }
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = (invoice as Stripe.Invoice & { subscription?: string | { id: string } }).subscription
        const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id ?? null
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
                await updateSubscriptionAddonStatus(business.id, addon.addon_key, 'past_due')
              }
            }
          }
        }
        break
      }

      // Stripe Connect: account.updated (v1) — sync onboarding/charges state to DB
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const accountId = account.id
        if (accountId) {
          await syncStripeConnectAccountStatus(accountId)
        }
        break
      }

      default: {
        // Stripe Connect v2 account events (not in SDK event type union) — same sync
        const v2AccountTypes = [
          'v2.core.account.updated',
          'v2.core.account[requirements].updated',
          'v2.core.account[defaults].updated',
          'v2.core.account[identity].updated',
        ]
        if (v2AccountTypes.includes(event.type as string)) {
          const ev = event as Stripe.Event & { data?: { object?: { id?: string }; id?: string }; related_object?: { id?: string } }
          const accountId =
            ev.data?.object?.id ??
            ev.data?.id ??
            ev.related_object?.id
          if (accountId && typeof accountId === 'string') {
            await syncStripeConnectAccountStatus(accountId)
          }
        } else {
          console.log(`Unhandled event type: ${event.type}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error processing webhook:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
