import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/permissions'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null

/**
 * Admin-only: create a Stripe subscription checkout session for the current user.
 * Used to test the payment flow with Stripe test cards (e.g. 4242 4242 4242 4242).
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email || !user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const planId = (body.planId as string) || 'starter'
    const billingPeriod = (body.billingPeriod === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly'
    const teamSize = typeof body.teamSize === 'number' ? body.teamSize : (planId === 'starter' ? 1 : planId === 'pro' ? 2 : 3)

    if (!['starter', 'pro', 'fleet'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid planId' },
        { status: 400 }
      )
    }

    // Get business name for the current user
    let businessName = ''
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('owner_id', user.id)
      .single()
    if (business?.name) businessName = business.name

    // Resolve Stripe price ID (same logic as create-subscription-checkout).
    // Fallback for starter monthly so checkout works when env is missing (e.g. Vercel not set).
    const STARTER_MONTHLY_FALLBACK = 'price_1T2fXBEFwhk3BrMmB98cZ2jm'
    let priceId: string | undefined
    let expectedEnvVar = ''
    if (planId === 'starter') {
      expectedEnvVar = billingPeriod === 'monthly'
        ? 'STRIPE_STARTER_MONTHLY_PRICE_ID'
        : 'STRIPE_STARTER_YEARLY_PRICE_ID'
      if (billingPeriod === 'monthly') {
        priceId = (process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '').trim() || STARTER_MONTHLY_FALLBACK
      } else {
        priceId = (process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '').trim()
      }
    } else if (planId === 'pro') {
      const finalTeamSize = teamSize <= 2 ? teamSize : 3
      if (finalTeamSize <= 2) {
        expectedEnvVar = billingPeriod === 'monthly'
          ? 'STRIPE_PRICE_PRO_1_2_MONTHLY'
          : 'STRIPE_PRICE_PRO_1_2_ANNUAL'
        priceId = billingPeriod === 'monthly'
          ? process.env.STRIPE_PRICE_PRO_1_2_MONTHLY
          : process.env.STRIPE_PRICE_PRO_1_2_ANNUAL
      } else {
        expectedEnvVar = billingPeriod === 'monthly'
          ? 'STRIPE_PRICE_PRO_3_MONTHLY'
          : 'STRIPE_PRICE_PRO_3_ANNUAL'
        priceId = billingPeriod === 'monthly'
          ? process.env.STRIPE_PRICE_PRO_3_MONTHLY
          : process.env.STRIPE_PRICE_PRO_3_ANNUAL
      }
    } else {
      const finalTeamSize = teamSize <= 3 ? teamSize : Math.min(teamSize, 5)
      if (finalTeamSize <= 3) {
        expectedEnvVar = billingPeriod === 'monthly'
          ? 'STRIPE_PRICE_FLEET_1_3_MONTHLY'
          : 'STRIPE_PRICE_FLEET_1_3_ANNUAL'
        priceId = billingPeriod === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_1_3_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_1_3_ANNUAL
      } else {
        expectedEnvVar = billingPeriod === 'monthly'
          ? 'STRIPE_PRICE_FLEET_4_5_MONTHLY'
          : 'STRIPE_PRICE_FLEET_4_5_ANNUAL'
        priceId = billingPeriod === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_4_5_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_4_5_ANNUAL
      }
    }

    if (!priceId) {
      const isSet = typeof process.env[expectedEnvVar] === 'string' && process.env[expectedEnvVar]!.trim().length > 0
      const isProd = process.env.VERCEL === '1' || (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL?.includes('localhost'))
      return NextResponse.json(
        {
          error: `Price ID not found. Add ${expectedEnvVar}=price_xxxxx.`,
          debug: {
            envVar: expectedEnvVar,
            isSet,
            hint: isProd
              ? 'On production (Vercel): set this in Vercel → Project → Settings → Environment Variables, then redeploy.'
              : !isSet
                ? 'Local: .env.local in brnno-io, exact variable name, no spaces around =, restart dev server (npm run dev).'
                : 'Value may be invalid (use only the price_xxx ID).',
          },
        },
        { status: 400 }
      )
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })
    let customerId: string
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: businessName || undefined,
        metadata: {
          user_id: user.id,
          business_name: businessName || '',
        },
      })
      customerId = customer.id
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const finalTeamSize = planId === 'starter' ? 1 : planId === 'pro' ? Math.min(Math.max(teamSize, 1), 3) : Math.min(Math.max(teamSize, 1), 5)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings/subscription?success=true&admin_test=1`,
      cancel_url: `${appUrl}/dashboard/settings/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_period: billingPeriod,
        business_name: businessName || '',
        team_size: finalTeamSize.toString(),
        signup_lead_id: '',
        signup_data: '',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
          billing_period: billingPeriod,
          business_name: businessName || '',
          team_size: finalTeamSize.toString(),
          signup_lead_id: '',
          signup_data: '',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Admin test checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
