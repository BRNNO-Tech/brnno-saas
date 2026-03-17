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

// Module → price ID map based on billing interval
function getPriceId(module: string, interval: string, aiEnabled?: boolean): string | undefined {
  const env = process.env

  const prices: Record<string, Record<string, string | undefined>> = {
    leadRecovery: {
      monthly: aiEnabled ? env.STRIPE_PRICE_AI_AUTO_LEAD_MONTHLY_V1 : env.STRIPE_PRICE_LEAD_RECOVERY_MONTHLY_V1,
      annual: aiEnabled ? env.STRIPE_PRICE_AI_AUTO_LEAD_ANNUAL_V1 : env.STRIPE_PRICE_LEAD_RECOVERY_ANNUAL_V1,
      founders: aiEnabled ? env.STRIPE_PRICE_AI_AUTO_LEAD_FOUNDERS_V1 : env.STRIPE_PRICE_LEAD_RECOVERY_FOUNDERS_V1,
    },
    invoices: {
      monthly: env.STRIPE_PRICE_INVOICES_MONTHLY_V1,
      annual: env.STRIPE_PRICE_INVOICES_ANNUAL_V1,
      founders: env.STRIPE_PRICE_INVOICES_FOUNDERS_V1,
    },
    quickQuote: {
      monthly: env.STRIPE_PRICE_QUICK_QUOTE_MONTHLY_V1,
      annual: env.STRIPE_PRICE_QUICK_QUOTE_ANNUAL_V1,
      founders: env.STRIPE_PRICE_QUICK_QUOTE_FOUNDERS_V1,
    },
    photos: {
      monthly: env.STRIPE_PRICE_PHOTOS_MONTHLY_V1,
      annual: env.STRIPE_PRICE_PHOTOS_ANNUAL_V1,
      founders: env.STRIPE_PRICE_PHOTOS_FOUNDERS_V1,
    },
    mileage: {
      monthly: env.STRIPE_PRICE_MILEAGE_TRACKER_MONTHLY_V1,
      annual: env.STRIPE_PRICE_MILEAGE_TRACKER_ANNUAL_V1,
      founders: env.STRIPE_PRICE_MILEAGE_TRACKER_FOUNDERS_V1,
    },
    inventory: {
      monthly: env.STRIPE_PRICE_INVENTORY_MANAGEMENT_MONTHLY_V1,
      annual: env.STRIPE_PRICE_INVENTORY_MANAGEMENT_ANNUAL_V1,
      founders: env.STRIPE_PRICE_INVENTORY_MANAGEMENT_FOUNDERS_V1,
    },
    teamManagement: {
      monthly: env.STRIPE_PRICE_TEAM_MANAGEMENT_MONTHLY_V1,
      annual: env.STRIPE_PRICE_TEAM_MANAGEMENT_ANNUAL_V1,
      founders: env.STRIPE_PRICE_TEAM_MANAGEMENT_FOUNDERS_V1,
    },
    reviews: {
      monthly: env.STRIPE_PRICE_REVIEWS_MONTHLY_V1,
      annual: env.STRIPE_PRICE_REVIEWS_ANNUAL_V1,
      founders: env.STRIPE_PRICE_REVIEWS_ANNUAL_V1,
    },
  }

  return prices[module]?.[interval]
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch (parseErr) {
      console.error('[toggle-module] invalid or missing JSON body:', parseErr)
      return NextResponse.json(
        { error: 'Invalid or missing request body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.log('[toggle-module] request body:', JSON.stringify(body))

    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
    const businessId = raw.businessId
    const module = raw.module
    const action = raw.action
    const aiEnabled = raw.aiEnabled
    // action: 'add' | 'remove' | 'toggle-ai'

    if (!businessId || !module || !action) {
      console.error('[toggle-module] 400:', 'Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const businessIdStr = String(businessId)
    const moduleStr = String(module)
    const actionStr = String(action)
    const aiEnabledBool = aiEnabled === true || aiEnabled === 'true'

    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, stripe_customer_id, billing_plan, billing_interval, owner_id, name')
      .eq('id', businessIdStr)
      .single()

    const hasSubscription = !!business?.stripe_subscription_id

    // Team Management stays Pro-only: free users cannot add it
    const isPro = (business?.billing_plan as string) === 'pro'
    if (actionStr === 'add' && moduleStr === 'teamManagement' && !isPro) {
      console.error('[toggle-module] 400:', 'Team Management requires Pro plan')
      return NextResponse.json({ error: 'Team Management requires Pro plan' }, { status: 400 })
    }

    if (!hasSubscription) {
      if (actionStr === 'remove' || actionStr === 'toggle-ai') {
        console.error('[toggle-module] 400: No subscription found')
        return NextResponse.json(
          { error: 'No active subscription found. Subscribe to a plan first, then add Lead Recovery before enabling AI.' },
          { status: 400 }
        )
      }
      // action === 'add' and no subscription: create Checkout session so user can enter payment method
      const priceId = getPriceId(moduleStr, 'monthly', aiEnabledBool)
      if (!priceId) {
        console.error('[toggle-module] 400:', `Price ID not found for ${moduleStr}`)
        return NextResponse.json({ error: `Price ID not found for ${moduleStr}` }, { status: 400 })
      }
      const ownerId = (business as { owner_id?: string })?.owner_id
      if (!ownerId) {
        console.error('[toggle-module] 400:', 'Business has no owner')
        return NextResponse.json({ error: 'Business has no owner' }, { status: 400 })
      }
      const { data: { user: owner } } = await supabase.auth.admin.getUserById(ownerId)
      const email = owner?.email ?? undefined
      const businessName = (business as { name?: string })?.name ?? undefined

      let customerId = (business as { stripe_customer_id?: string })?.stripe_customer_id
      if (!customerId) {
        const { data: stripeCustomer } = await supabase
          .from('stripe_customers')
          .select('stripe_customer_id')
          .eq('user_id', ownerId)
          .single()
        if (stripeCustomer?.stripe_customer_id) {
          customerId = stripeCustomer.stripe_customer_id
        } else {
          const customer = await stripe.customers.create({
            email,
            name: businessName,
            metadata: { business_id: businessIdStr },
          })
          customerId = customer.id
          await supabase
            .from('businesses')
            .update({ stripe_customer_id: customerId }).eq('id', businessIdStr)
          await supabase
            .from('stripe_customers')
            .upsert({ user_id: ownerId, stripe_customer_id: customerId }, { onConflict: 'user_id' })
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard/settings/subscription?canceled=true`,
        metadata: {
          business_id: businessIdStr,
          module: moduleStr,
          action: 'add',
          user_id: ownerId,
          plan_id: 'free',
          billing_period: 'monthly',
        },
        subscription_data: {
          metadata: {
            business_id: businessIdStr,
            module: moduleStr,
            user_id: ownerId,
            plan_id: 'free',
          },
        },
      })

      const checkoutUrl = session.url
      if (!checkoutUrl) {
        console.error('[toggle-module] 500:', 'No checkout URL from Stripe')
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
      }
      return NextResponse.json({ success: true, checkoutUrl })
    }

    let interval = ((business.billing_interval as string) || 'monthly').toLowerCase()
    if (interval === 'yearly') interval = 'annual'

    // Get existing module item if any
    const { data: existingItem } = await supabase
      .from('billing_items')
      .select('*')
      .eq('business_id', businessIdStr)
      .eq('module', moduleStr)
      .maybeSingle()

    if (actionStr === 'add') {
      if (existingItem) {
        return NextResponse.json({ message: 'Module already active' })
      }

      const priceId = getPriceId(moduleStr, interval, aiEnabledBool)
      if (!priceId) {
        console.error('[toggle-module] 400:', `Price ID not found for ${moduleStr}`)
        return NextResponse.json({ error: `Price ID not found for ${moduleStr}` }, { status: 400 })
      }

      const item = await stripe.subscriptionItems.create({
        subscription: business.stripe_subscription_id,
        price: priceId,
        quantity: 1,
      })

      await supabase.from('billing_items').insert({
        business_id: businessIdStr,
        module: moduleStr,
        stripe_price_id: priceId,
        stripe_subscription_item_id: item.id,
      })

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessIdStr)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      if (moduleStr === 'leadRecovery') {
        modules.leadRecovery = { enabled: true, ai: aiEnabledBool }
      } else {
        modules[moduleStr] = true
      }

      await supabase.from('businesses').update({ modules }).eq('id', businessIdStr)

    } else if (actionStr === 'remove') {
      if (!existingItem) {
        return NextResponse.json({ message: 'Module not active' })
      }

      // Remove item from Stripe (immediate; no proration credit with proration_behavior: 'none')
      await stripe.subscriptionItems.del(existingItem.stripe_subscription_item_id, {
        proration_behavior: 'none',
      })

      await supabase
        .from('billing_items')
        .delete()
        .eq('business_id', businessIdStr)
        .eq('module', moduleStr)

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessIdStr)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      if (moduleStr === 'leadRecovery') {
        modules.leadRecovery = { enabled: false, ai: false }
      } else {
        modules[moduleStr] = false
      }

      await supabase.from('businesses').update({ modules }).eq('id', businessIdStr)

    } else if (actionStr === 'toggle-ai') {
      // Swap Lead Recovery price ID (standard ↔ AI)
      if (!existingItem) {
        console.error('[toggle-module] 400: Lead Recovery not active')
        return NextResponse.json(
          { error: 'Lead Recovery module must be active before you can enable or disable AI. Add Lead Recovery first.' },
          { status: 400 }
        )
      }

      const newPriceId = getPriceId('leadRecovery', interval, aiEnabledBool)
      if (!newPriceId) {
        console.error('[toggle-module] 400: AI Lead Recovery price not configured for interval', interval)
        return NextResponse.json(
          { error: 'AI Lead Recovery price is not configured. Please contact support or try again later.' },
          { status: 400 }
        )
      }

      await stripe.subscriptionItems.update(existingItem.stripe_subscription_item_id, {
        price: newPriceId,
        proration_behavior: 'create_prorations',
      } as Stripe.SubscriptionItemUpdateParams)

      await supabase
        .from('billing_items')
        .update({ stripe_price_id: newPriceId })
        .eq('business_id', businessIdStr)
        .eq('module', moduleStr)

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessIdStr)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      modules.leadRecovery = { enabled: true, ai: aiEnabledBool }
      await supabase.from('businesses').update({ modules }).eq('id', businessIdStr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[toggle-module] unhandled error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
