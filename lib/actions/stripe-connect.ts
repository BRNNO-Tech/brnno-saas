'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null

// Service role client for billing operations (bypasses RLS)
const supabaseService =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : null

// Remove legacy platform-access subscription item (grandfathered subs only)
async function removePlatformFee(businessId: string, platformFeeItemId: string) {
  if (!stripe || !supabaseService) return

  try {
    await stripe.subscriptionItems.del(platformFeeItemId)

    await supabaseService
      .from('businesses')
      .update({ platform_fee_item_id: null })
      .eq('id', businessId)

    console.log(`Removed platform fee for business ${businessId}`)
  } catch (err) {
    console.error('Failed to remove platform fee:', err)
  }
}

export async function createStripeConnectAccount() {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  // Check if they already have a Stripe account
  if (business.stripe_account_id) {
    try {
      const loginLink = await stripe.accounts.createLoginLink(business.stripe_account_id)
      if (!loginLink?.url) throw new Error('Failed to create Stripe login link')
      redirect(loginLink.url)
    } catch (err: unknown) {
      const isStripeError = err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'StripeInvalidRequestError'
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : ''
      if (isStripeError && message.includes('has not completed onboarding')) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const accountLink = await stripe.accountLinks.create({
          account: business.stripe_account_id,
          refresh_url: `${appUrl}/dashboard/settings?stripe=refresh`,
          return_url: `${appUrl}/dashboard/settings?stripe=success`,
          type: 'account_onboarding',
        })
        if (!accountLink?.url) throw new Error('Failed to create Stripe account link')
        return { redirectUrl: accountLink.url, message: 'Please complete your Stripe setup to access your dashboard' }
      }
      throw err
    }
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
    },
  })

  await supabase
    .from('businesses')
    .update({
      stripe_account_id: account.id,
      stripe_onboarding_completed: false,
    })
    .eq('owner_id', user.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${appUrl}/dashboard/settings?stripe=refresh`,
    return_url: `${appUrl}/dashboard/settings?stripe=success`,
    type: 'account_onboarding',
  })

  if (!accountLink?.url) throw new Error('Failed to create Stripe account link')
  redirect(accountLink.url)
}

// Called when Stripe Connect onboarding completes successfully (return URL).
// Re-sync from Stripe so DB reflects actual account state (Stripe may still be verifying).
export async function handleStripeConnectSuccess(businessId: string) {
  if (!supabaseService) return

  const { data: business } = await supabaseService
    .from('businesses')
    .select('stripe_account_id, stripe_subscription_id, platform_fee_item_id, stripe_onboarding_completed')
    .eq('id', businessId)
    .single()

  if (!business) return

  // Re-sync account status from Stripe so we don't rely on stale DB if Stripe verifies later
  if (business.stripe_account_id) {
    await syncStripeConnectAccountStatus(business.stripe_account_id)
  } else {
    await supabaseService
      .from('businesses')
      .update({ stripe_onboarding_completed: true })
      .eq('id', businessId)
  }

  // Re-fetch in case sync updated onboarding; then remove platform fee if now complete
  const { data: updated } = await supabaseService
    .from('businesses')
    .select('stripe_onboarding_completed, platform_fee_item_id, stripe_subscription_id')
    .eq('id', businessId)
    .single()

  if (updated?.stripe_onboarding_completed && updated.platform_fee_item_id && updated.stripe_subscription_id) {
    await removePlatformFee(businessId, updated.platform_fee_item_id)
  }
}

// Called when Stripe Connect onboarding is interrupted (refresh URL)
export async function handleStripeConnectMissing(businessId: string) {
  if (!supabaseService) return

  await supabaseService
    .from('businesses')
    .update({ stripe_onboarding_completed: false })
    .eq('id', businessId)
}

export async function getStripeAccountStatus(accountId: string) {
  if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
    return {
      chargesEnabled: true,
      detailsSubmitted: true,
      payoutsEnabled: true,
    }
  }

  if (!stripe) {
    return {
      chargesEnabled: false,
      detailsSubmitted: false,
      payoutsEnabled: false,
    }
  }

  const account = await stripe.accounts.retrieve(accountId)
  return {
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
  }
}

/**
 * Sync Stripe Connect account status to businesses table.
 * Call from account.updated webhook and from return URL handler so DB stays in sync with Stripe.
 */
export async function syncStripeConnectAccountStatus(accountId: string): Promise<void> {
  if (!stripe || !supabaseService) return
  try {
    const account = await stripe.accounts.retrieve(accountId)
    const onboardingComplete = Boolean(account.details_submitted && account.charges_enabled)
    await supabaseService
      .from('businesses')
      .update({ stripe_onboarding_completed: onboardingComplete })
      .eq('stripe_account_id', accountId)
  } catch (err) {
    console.error('[syncStripeConnectAccountStatus]', accountId, err)
  }
}
