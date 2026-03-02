import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { planId, billingPeriod, email, businessName, userId, signupData, teamSize, signupLeadId } = body

    if (!planId || !email || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── NEW PLANS ──────────────────────────────────────────────
    // planId: 'free' | 'pro'
    // Free plan has no checkout — handled via /api/billing/create-free-subscription directly
    // Pro plan goes through Stripe Checkout

    if (planId === 'free') {
      return NextResponse.json({ error: 'Free plan has no checkout; use /api/billing/create-free-subscription' }, { status: 400 })
    }

    if (planId === 'pro') {
      const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY_V1
      if (!priceId) {
        return NextResponse.json({ error: 'Pro price ID not configured' }, { status: 500 })
      }

      const customers = await stripe.customers.list({ email, limit: 1 })
      let customerId: string
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email,
          name: businessName,
          metadata: { user_id: userId, business_name: businessName || '' },
        })
        customerId = customer.id
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
          user_id: userId,
          plan_id: 'pro',
          billing_period: 'monthly',
          business_name: businessName || '',
          signup_lead_id: signupLeadId || '',
          signup_data: signupData ? JSON.stringify(signupData) : '',
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            plan_id: 'pro',
            billing_period: 'monthly',
            business_name: businessName || '',
            signup_lead_id: signupLeadId || '',
          },
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── LEGACY PLANS (keep for backward compat) ────────────────
    // planId: 'starter' | 'fleet' (old tiers)
    const period: 'monthly' | 'yearly' = billingPeriod === 'monthly' || billingPeriod === 'yearly'
      ? billingPeriod
      : 'monthly'

    const STARTER_MONTHLY_FALLBACK = 'price_1T2fXBEFwhk3BrMmB98cZ2jm'
    let priceId: string | undefined

    if (planId === 'starter') {
      priceId = period === 'monthly'
        ? (process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '').trim() || STARTER_MONTHLY_FALLBACK
        : (process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '').trim()
    } else if (planId === 'fleet') {
      const finalTeamSize = teamSize || 3
      if (finalTeamSize <= 3) {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_1_3_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_1_3_ANNUAL
      } else {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_4_5_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_4_5_ANNUAL
      }
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not found for selected plan' }, { status: 400 })
    }

    const customers = await stripe.customers.list({ email, limit: 1 })
    let customerId: string
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email,
        name: businessName,
        metadata: { user_id: userId, business_name: businessName || '' },
      })
      customerId = customer.id
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const finalTeamSize = teamSize || (planId === 'starter' ? 1 : 3)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?step=4&canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        billing_period: period,
        business_name: businessName || '',
        team_size: finalTeamSize.toString(),
        signup_lead_id: signupLeadId || '',
        signup_data: signupData ? JSON.stringify(signupData) : '',
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          billing_period: period,
          business_name: businessName || '',
          team_size: finalTeamSize.toString(),
          signup_lead_id: signupLeadId || '',
          signup_data: signupData ? JSON.stringify(signupData) : '',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error)
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 })
  }
}
