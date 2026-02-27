import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      email,
      businessName,
      planId,
      billingPeriod,
      teamSize,
      signupLeadId,
      signupData,
    } = body || {}

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminListRaw = process.env.ADMIN_SIGNUP_EMAILS || process.env.ADMIN_EMAILS || ''
    const adminEmails = adminListRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (!adminEmails.includes(String(email).toLowerCase())) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Auto-confirm email
    try {
      await supabase.auth.admin.updateUserById(userId, { email_confirm: true })
    } catch (confirmError: any) {
      console.warn(`Could not auto-confirm email for ${email}:`, confirmError)
    }

    if (signupLeadId) {
      await supabase
        .from('signup_leads')
        .update({ converted: true, converted_at: new Date().toISOString() })
        .eq('id', signupLeadId)
    }

    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('owner_id', userId)
      .single()

    const normalizedPlan = planId || 'starter'
    const normalizedPeriod = billingPeriod === 'yearly' ? 'yearly' : 'monthly'
    const normalizedTeamSize = teamSize || (normalizedPlan === 'starter' ? 1 : normalizedPlan === 'pro' ? 2 : 3)

    // Map old plan names to new billing_plan
    const billingPlan = normalizedPlan === 'pro' || normalizedPlan === 'fleet' ? 'pro' : 'free'

    let businessId: string

    if (!existingBusiness) {
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          name: signupData?.businessName || businessName || 'My Business',
          email: signupData?.email || email || null,
          phone: signupData?.phone || null,
          address: signupData?.address || null,
          city: signupData?.city || null,
          state: signupData?.state || null,
          zip: signupData?.zip || null,
          subdomain: signupData?.subdomain || null,
          description: signupData?.description || null,
          // Legacy columns
          subscription_plan: normalizedPlan,
          subscription_status: 'active',
          subscription_billing_period: normalizedPeriod,
          subscription_started_at: new Date().toISOString(),
          team_size: normalizedTeamSize,
          // New billing columns
          billing_plan: billingPlan,
          billing_interval: 'monthly',
        })
        .select('id')
        .single()

      if (businessError || !newBusiness) {
        return NextResponse.json(
          { error: businessError?.message || 'Failed to create business' },
          { status: 500 }
        )
      }

      businessId = newBusiness.id
    } else {
      await supabase
        .from('businesses')
        .update({
          subscription_plan: normalizedPlan,
          subscription_status: 'active',
          subscription_billing_period: normalizedPeriod,
          subscription_started_at: new Date().toISOString(),
          team_size: normalizedTeamSize,
          billing_plan: billingPlan,
          billing_interval: 'monthly',
        })
        .eq('owner_id', userId)

      businessId = existingBusiness.id
    }

    // Create Stripe customer + subscription if Stripe is configured
    // and business doesn't already have a subscription
    const existingSubId = existingBusiness?.stripe_subscription_id
    if (stripe && !existingSubId) {
      try {
        // Get or create Stripe customer
        let customerId = existingBusiness?.stripe_customer_id

        if (!customerId) {
          const { data: stripeCustomer } = await supabase
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

          if (stripeCustomer?.stripe_customer_id) {
            customerId = stripeCustomer.stripe_customer_id
          } else {
            const customer = await stripe.customers.create({
              email: signupData?.email || email,
              name: signupData?.businessName || businessName || 'My Business',
              metadata: { user_id: userId, business_id: businessId },
            })
            customerId = customer.id

            await supabase
              .from('stripe_customers')
              .upsert(
                { user_id: userId, stripe_customer_id: customerId },
                { onConflict: 'user_id' }
              )
          }
        }

        // Create free subscription shell — no items, $0/month
        // Modules and Pro plan get added later from the dashboard
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [],
          metadata: {
            business_id: businessId,
            user_id: userId,
            plan_id: 'free',
          },
        })

        // Save subscription to business
        await supabase
          .from('businesses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
          })
          .eq('id', businessId)

        console.log(`Created Stripe subscription ${subscription.id} for business ${businessId}`)
      } catch (stripeError: any) {
        // Don't fail the whole signup if Stripe errors
        // Business is created, they can add billing later
        console.error('Stripe setup failed during admin signup:', stripeError.message)
      }
    }

    return NextResponse.json({ success: true, redirect: '/dashboard' })
  } catch (error: any) {
    console.error('Admin signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete admin signup' },
      { status: 500 }
    )
  }
}
