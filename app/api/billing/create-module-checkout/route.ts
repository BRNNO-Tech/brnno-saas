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
  }
  return prices[module]?.[interval]
}

type ModuleInput = { key: string; aiEnabled?: boolean }

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 })
    }

    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
    const businessId = raw.businessId
    const modulesInput = raw.modules

    if (!businessId || !Array.isArray(modulesInput) || modulesInput.length === 0) {
      return NextResponse.json(
        { error: 'Missing businessId or non-empty modules array' },
        { status: 400 }
      )
    }

    const businessIdStr = String(businessId)
    const modules = modulesInput as ModuleInput[]

    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, stripe_customer_id, billing_plan, owner_id, name')
      .eq('id', businessIdStr)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    if (business.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Business already has a subscription; use toggle-module instead' },
        { status: 400 }
      )
    }

    const isPro = (business.billing_plan as string) === 'pro'
    for (const m of modules) {
      const key = String(m?.key ?? '')
      if (key === 'teamManagement' && !isPro) {
        return NextResponse.json(
          { error: 'Team Management requires Pro plan' },
          { status: 400 }
        )
      }
    }

    const ownerId = (business as { owner_id?: string }).owner_id
    if (!ownerId) {
      return NextResponse.json({ error: 'Business has no owner' }, { status: 400 })
    }

    const { data: { user: owner } } = await supabase.auth.admin.getUserById(ownerId)
    const email = owner?.email ?? undefined
    const businessName = (business as { name?: string }).name ?? undefined

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const modulesMeta: { key: string; aiEnabled: boolean }[] = []

    for (const m of modules) {
      const key = String(m?.key ?? '')
      const aiEnabled = m?.aiEnabled === true || m?.aiEnabled === 'true'
      const priceId = getPriceId(key, 'monthly', aiEnabled)
      if (!priceId) {
        return NextResponse.json(
          { error: `Price ID not found for module: ${key}` },
          { status: 400 }
        )
      }
      line_items.push({ price: priceId, quantity: 1 })
      modulesMeta.push({ key, aiEnabled })
    }

    let customerId = (business as { stripe_customer_id?: string }).stripe_customer_id
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
      line_items,
      success_url: `${appUrl}/dashboard/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/settings/subscription?canceled=true`,
      metadata: {
        business_id: businessIdStr,
        user_id: ownerId,
        plan_id: 'free',
        billing_period: 'monthly',
        action: 'add',
        modules: JSON.stringify(modulesMeta),
      },
      subscription_data: {
        metadata: {
          business_id: businessIdStr,
          user_id: ownerId,
          plan_id: 'free',
          modules: JSON.stringify(modulesMeta),
        },
      },
    })

    const checkoutUrl = session.url
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('[create-module-checkout] error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
