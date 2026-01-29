import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getBusiness } from '@/lib/actions/business'
import { getSubscriptionAddons, getBusinessSubscriptionAddons } from '@/lib/actions/subscription-addons'
import { getTierFromBusiness, type Tier } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import SubscriptionAddonsList from '@/components/subscription/addons-list'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Package, CheckCircle2 } from 'lucide-react'
import { DashboardPageError } from '@/components/dashboard/page-error'

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; highlight?: string; canceled?: string }>
}) {
  const params = await searchParams

  // Force fresh subscription data when viewing this page (helps after extending trial in DB)
  revalidatePath('/dashboard', 'layout')

  let business: Awaited<ReturnType<typeof getBusiness>>
  let tier: Tier = null
  let availableAddons: Awaited<ReturnType<typeof getSubscriptionAddons>>
  let activeAddons: Awaited<ReturnType<typeof getBusinessSubscriptionAddons>>

  try {
    business = await getBusiness()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    tier = business ? getTierFromBusiness(business, user?.email || null) : null
    availableAddons = await getSubscriptionAddons()
    activeAddons = await getBusinessSubscriptionAddons()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred.'
    try {
      const b = await getBusiness()
      if (b && b.subscription_status !== 'active' && b.subscription_status !== 'trialing') {
        return <DashboardPageError isTrialEnded />
      }
    } catch { /* ignore */ }
    if (msg.includes('Not authenticated') || msg.includes('Authentication error')) {
      redirect('/login')
    }
    const isNoBusiness = msg.includes('No business found')
    return (
      <DashboardPageError
        message={msg}
        isNoBusiness={isNoBusiness}
        title={isNoBusiness ? 'Business Setup Required' : 'Unable to load subscription'}
      />
    )
  }

  const planName = business?.subscription_plan 
    ? business.subscription_plan.charAt(0).toUpperCase() + business.subscription_plan.slice(1)
    : 'No Plan'

  const planStatus = business?.subscription_status || 'inactive'
  // Type assertion to access subscription_billing_period which may not be in the base type
  const businessWithBilling = business as any
  const billingPeriod = businessWithBilling?.subscription_billing_period || 'monthly'

  // Diagnostic: what the app sees (for support when trial is extended but access is wrong)
  const endsAtRaw = businessWithBilling?.subscription_ends_at ?? null
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null
  const trialValid = !endsAt || endsAt > new Date()
  const showDiagnostic = tier === null && business != null

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Subscription & Add-ons</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
              Manage your subscription plan and add-on features
            </p>
          </div>

          {/* Trial / subscription ended - prominent message */}
          {planStatus !== 'active' && planStatus !== 'trialing' && (
            <div className="mb-6 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-400">
                Your trial has ended
              </h2>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your trial or subscription has ended. Subscribe to keep using BRNNO and restore full access.
              </p>
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Choose a plan below to continue.
              </p>
              <p className="mt-3 text-xs text-amber-600/80 dark:text-amber-400/80">
                If your trial was just extended by support, refresh this page or log out and log back in to update your access.
              </p>
            </div>
          )}

          {/* For support: show what the app sees when tier is null (helps debug extended trial not recognized) */}
          {showDiagnostic && (
            <div className="mb-6 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/50 p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
              <p className="font-sans font-medium text-zinc-900 dark:text-zinc-100 mb-2">For support — what this account sees:</p>
              <ul className="space-y-1">
                <li>subscription_plan: {business?.subscription_plan ?? '(empty)'}</li>
                <li>subscription_status: {business?.subscription_status ?? '(empty)'}</li>
                <li>subscription_ends_at: {endsAtRaw ?? '(empty)'}</li>
                <li>trial_valid (ends_at in future?): {trialValid ? 'yes' : 'no'}</li>
                <li>computed tier: {tier ?? 'null (no access)'}</li>
              </ul>
              <p className="font-sans mt-2 text-zinc-600 dark:text-zinc-400">
                If you extended the trial in Supabase, run Step 3 in database/extend_trial.sql with this user&apos;s email and compare. Plan must be set, status = trialing, ends_at in the future.
              </p>
            </div>
          )}

          {/* Success Message */}
          {params.success === 'true' && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Successfully subscribed! Your add-on is now active.
                </p>
              </div>
            </div>
          )}

          {/* Canceled Message */}
          {params.canceled === 'true' && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Checkout was canceled. No charges were made.
                </p>
              </div>
            </div>
          )}

          {/* Current Subscription */}
          <CardShell title="Current Subscription" subtitle="Your active plan and billing information">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-zinc-50/50 dark:bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
                    <CreditCard className="h-6 w-6 text-zinc-700 dark:text-white/70" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-white">{planName} Plan</p>
                      <Badge 
                        variant={planStatus === 'active' ? 'default' : planStatus === 'trialing' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {planStatus === 'active' ? 'Active' : planStatus === 'trialing' ? 'Trial' : planStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-white/55">
                      Billed {billingPeriod === 'monthly' ? 'monthly' : 'annually'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Manage Plan
                </Button>
              </div>
            </div>
          </CardShell>

          {/* Subscription Add-ons */}
          <div className="mt-6">
            <CardShell 
              title="Subscription Add-ons" 
              subtitle="Enhance your plan with additional features"
            >
              <SubscriptionAddonsList 
                availableAddons={availableAddons}
                activeAddons={activeAddons}
                tier={tier}
              />
            </CardShell>
          </div>
        </div>
      </div>
    </div>
  )
}
