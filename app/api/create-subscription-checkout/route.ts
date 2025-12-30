import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

// Plan price IDs - These need to be created in Stripe Dashboard first
// For now, we'll create them dynamically or use hardcoded test IDs
const PLAN_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  fleet: {
    monthly: process.env.STRIPE_FLEET_MONTHLY_PRICE_ID || 'price_fleet_monthly',
    yearly: process.env.STRIPE_FLEET_YEARLY_PRICE_ID || 'price_fleet_yearly',
  },
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { planId, billingPeriod, email, businessName, userId, signupData, teamSize } = body

    if (!planId || !billingPeriod || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate line items based on plan and team size
    const lineItems: Array<{ price: string; quantity: number }> = []

    if (planId === 'starter') {
      const basePriceId = PLAN_PRICE_IDS.starter[billingPeriod]
      if (!basePriceId) {
        return NextResponse.json(
          { error: 'Invalid plan or billing period' },
          { status: 400 }
        )
      }
      lineItems.push({ price: basePriceId, quantity: 1 })
    }

    if (planId === 'pro') {
      const basePriceId = PLAN_PRICE_IDS.pro[billingPeriod]
      if (!basePriceId) {
        return NextResponse.json(
          { error: 'Invalid plan or billing period' },
          { status: 400 }
        )
      }
      // Base subscription (includes 1-2 techs)
      lineItems.push({ price: basePriceId, quantity: 1 })
      
      // Add 3rd technician if selected
      const finalTeamSize = teamSize || 2
      if (finalTeamSize === 3) {
        const extraTechPriceId = billingPeriod === 'monthly'
          ? (process.env.STRIPE_PRO_EXTRA_TECH_MONTHLY_PRICE_ID || 'price_pro_extra_tech_monthly')
          : (process.env.STRIPE_PRO_EXTRA_TECH_YEARLY_PRICE_ID || 'price_pro_extra_tech_yearly')
        lineItems.push({ price: extraTechPriceId, quantity: 1 })
      }
    }

    if (planId === 'fleet') {
      const basePriceId = PLAN_PRICE_IDS.fleet[billingPeriod]
      if (!basePriceId) {
        return NextResponse.json(
          { error: 'Invalid plan or billing period' },
          { status: 400 }
        )
      }
      // Base subscription (includes 1-3 techs)
      lineItems.push({ price: basePriceId, quantity: 1 })
      
      // Add extra technicians (4th and 5th)
      const finalTeamSize = teamSize || 3
      if (finalTeamSize > 3) {
        const extraTechs = finalTeamSize - 3
        const extraTechPriceId = billingPeriod === 'monthly'
          ? (process.env.STRIPE_FLEET_EXTRA_TECH_MONTHLY_PRICE_ID || 'price_fleet_extra_tech_monthly')
          : (process.env.STRIPE_FLEET_EXTRA_TECH_YEARLY_PRICE_ID || 'price_fleet_extra_tech_yearly')
        lineItems.push({ price: extraTechPriceId, quantity: extraTechs })
      }
    }

    // Get or create customer
    // First, try to find existing customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    let customerId: string
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: businessName,
        metadata: {
          user_id: userId,
          business_name: businessName || '',
        },
      })
      customerId = customer.id
    }

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create checkout session
    const finalTeamSize = teamSize || (planId === 'starter' ? 1 : (planId === 'pro' ? 2 : 3))
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?step=4&canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        billing_period: billingPeriod,
        business_name: businessName || '',
        team_size: finalTeamSize.toString(),
        // Store all signup data as JSON string in metadata
        signup_data: signupData ? JSON.stringify(signupData) : '',
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          billing_period: billingPeriod,
          business_name: businessName || '',
          team_size: finalTeamSize.toString(),
          signup_data: signupData ? JSON.stringify(signupData) : '',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

