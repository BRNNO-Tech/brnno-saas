import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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
    const { planId, billingPeriod, email, businessName, userId, signupData, teamSize, signupLeadId } = body

    if (!planId || !billingPeriod || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Type guard for billing period
    const period: 'monthly' | 'yearly' = billingPeriod === 'monthly' || billingPeriod === 'yearly' 
      ? billingPeriod 
      : 'monthly'

    // Get the correct price ID based on plan, billing period, and team size
    let priceId: string | undefined

    if (planId === 'starter') {
      priceId = period === 'monthly'
        ? process.env.STRIPE_STARTER_MONTHLY_PRICE_ID
        : process.env.STRIPE_STARTER_YEARLY_PRICE_ID
    } else if (planId === 'pro') {
      const finalTeamSize = teamSize || 2
      if (finalTeamSize <= 2) {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_PRO_1_2_MONTHLY
          : process.env.STRIPE_PRICE_PRO_1_2_ANNUAL
      } else {
        // teamSize === 3
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_PRO_3_MONTHLY
          : process.env.STRIPE_PRICE_PRO_3_ANNUAL
      }
    } else if (planId === 'fleet') {
      const finalTeamSize = teamSize || 3
      if (finalTeamSize <= 3) {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_1_3_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_1_3_ANNUAL
      } else {
        // teamSize === 4 or 5
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRICE_FLEET_4_5_MONTHLY
          : process.env.STRIPE_PRICE_FLEET_4_5_ANNUAL
      }
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not found for the selected plan, billing period, and team size' },
        { status: 400 }
      )
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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?step=4&canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        billing_period: period,
        business_name: businessName || '',
        team_size: finalTeamSize.toString(),
        signup_lead_id: signupLeadId || '', // Track signup lead for conversion
        // Store all signup data as JSON string in metadata
        signup_data: signupData ? JSON.stringify(signupData) : '',
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          billing_period: period,
          business_name: businessName || '',
          team_size: finalTeamSize.toString(),
          signup_lead_id: signupLeadId || '', // Track signup lead for conversion
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

