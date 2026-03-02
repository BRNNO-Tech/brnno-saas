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

/**
 * POST /api/signup/complete-free
 * For signup flow when user selects Free plan: create business + optional Stripe subscription shell.
 * Does not require admin whitelist.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, businessName, signupLeadId, signupData } = body || {}

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (signupLeadId) {
      await supabase
        .from('signup_leads')
        .update({ converted: true, converted_at: new Date().toISOString() })
        .eq('id', signupLeadId)
    }

    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id, stripe_subscription_id')
      .eq('owner_id', userId)
      .single()

    let businessId: string

    if (existingBusiness) {
      businessId = existingBusiness.id
      await supabase
        .from('businesses')
        .update({
          subscription_plan: 'starter',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          billing_plan: 'free',
          billing_interval: 'monthly',
        })
        .eq('id', businessId)
    } else {
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
          subscription_plan: 'starter',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          billing_plan: 'free',
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
    }

    if (stripe && !existingBusiness?.stripe_subscription_id) {
      try {
        const { data: business } = await supabase
          .from('businesses')
          .select('stripe_customer_id')
          .eq('id', businessId)
          .single()

        let customerId = business?.stripe_customer_id

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
              .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' })
          }
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [],
          metadata: { business_id: businessId, user_id: userId, plan_id: 'free' },
        })

        await supabase
          .from('businesses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
          })
          .eq('id', businessId)
      } catch (stripeErr: any) {
        console.error('Stripe setup failed during signup complete-free:', stripeErr?.message)
      }
    }

    return NextResponse.json({ success: true, redirect: '/dashboard' })
  } catch (error: any) {
    console.error('Signup complete-free error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete signup' },
      { status: 500 }
    )
  }
}
