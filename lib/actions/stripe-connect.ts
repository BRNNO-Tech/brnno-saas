'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
  : null

export async function createStripeConnectAccount() {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  // Check if they already have a Stripe account
  if (business.stripe_account_id) {
    // Generate login link for existing account
    const loginLink = await stripe.accounts.createLoginLink(
      business.stripe_account_id
    )
    if (!loginLink?.url) {
      throw new Error('Failed to create Stripe login link')
    }
    redirect(loginLink.url)
  }

  // Create new Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: business.email || user.email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    business_profile: {
      name: business.name,
      support_email: business.email || user.email || undefined,
    }
  })

  // Save account ID to database
  await supabase
    .from('businesses')
    .update({
      stripe_account_id: account.id,
      stripe_onboarding_completed: false
    })
    .eq('owner_id', user.id)

  // Get app URL (default to localhost for dev)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${appUrl}/dashboard/settings?stripe=refresh`,
    return_url: `${appUrl}/dashboard/settings?stripe=success`,
    type: 'account_onboarding',
  })

  if (!accountLink?.url) {
    throw new Error('Failed to create Stripe account link')
  }

  // redirect() throws NEXT_REDIRECT internally - this is expected and should not be caught
  redirect(accountLink.url)
}

export async function getStripeAccountStatus(accountId: string) {
  // MOCK MODE: Always return active status
  if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
    return {
      chargesEnabled: true,
      detailsSubmitted: true,
      payoutsEnabled: true
    }
  }

  if (!stripe) {
    return {
      chargesEnabled: false,
      detailsSubmitted: false,
      payoutsEnabled: false
    }
  }

  const account = await stripe.accounts.retrieve(accountId)

  return {
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled
  }
}
