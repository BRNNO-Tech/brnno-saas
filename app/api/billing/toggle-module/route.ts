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
  }

  return prices[module]?.[interval]
}

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const { businessId, module, action, aiEnabled } = await request.json()
  // action: 'add' | 'remove' | 'toggle-ai'

  if (!businessId || !module || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const interval = business.billing_interval || 'monthly'

    // Get existing module item if any
    const { data: existingItem } = await supabase
      .from('billing_items')
      .select('*')
      .eq('business_id', businessId)
      .eq('module', module)
      .maybeSingle()

    if (action === 'add') {
      if (existingItem) {
        return NextResponse.json({ message: 'Module already active' })
      }

      const priceId = getPriceId(module, interval, aiEnabled)
      if (!priceId) {
        return NextResponse.json({ error: `Price ID not found for ${module}` }, { status: 400 })
      }

      const item = await stripe.subscriptionItems.create({
        subscription: business.stripe_subscription_id,
        price: priceId,
        quantity: 1,
      })

      await supabase.from('billing_items').insert({
        business_id: businessId,
        module,
        stripe_price_id: priceId,
        stripe_subscription_item_id: item.id,
      })

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessId)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      if (module === 'leadRecovery') {
        modules.leadRecovery = { enabled: true, ai: aiEnabled || false }
      } else {
        modules[module] = true
      }

      await supabase.from('businesses').update({ modules }).eq('id', businessId)

    } else if (action === 'remove') {
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
        .eq('business_id', businessId)
        .eq('module', module)

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessId)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      if (module === 'leadRecovery') {
        modules.leadRecovery = { enabled: false, ai: false }
      } else {
        modules[module] = false
      }

      await supabase.from('businesses').update({ modules }).eq('id', businessId)

    } else if (action === 'toggle-ai') {
      // Swap Lead Recovery price ID (standard ↔ AI)
      if (!existingItem) {
        return NextResponse.json({ error: 'Lead Recovery not active' }, { status: 400 })
      }

      const newPriceId = getPriceId('leadRecovery', interval, aiEnabled)
      if (!newPriceId) {
        return NextResponse.json({ error: 'Price ID not found' }, { status: 400 })
      }

      await stripe.subscriptionItems.update(existingItem.stripe_subscription_item_id, {
        price: newPriceId,
        proration_behavior: 'create_prorations',
      } as Stripe.SubscriptionItemUpdateParams)

      await supabase
        .from('billing_items')
        .update({ stripe_price_id: newPriceId })
        .eq('business_id', businessId)
        .eq('module', module)

      // Update modules JSONB
      const { data: biz } = await supabase
        .from('businesses')
        .select('modules')
        .eq('id', businessId)
        .single()

      const modules: Record<string, unknown> = (biz?.modules as Record<string, unknown>) || {}
      modules.leadRecovery = { enabled: true, ai: aiEnabled }
      await supabase.from('businesses').update({ modules }).eq('id', businessId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error toggling module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
