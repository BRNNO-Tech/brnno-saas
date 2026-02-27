'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GlowBG } from '@/components/ui/glow-bg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Zap,
  Target,
  Briefcase,
  Camera,
  Navigation,
  Package,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

type BillingPlan = 'free' | 'pro'
type BillingInterval = 'monthly' | 'annual' | 'founders'

interface ModuleConfig {
  key: string
  name: string
  description: string
  icon: React.ReactNode
  monthlyPrice: number
  annualPrice: number
  foundersPrice: number
  requiresPro?: boolean
  hasAiToggle?: boolean
}

interface Business {
  id: string
  billing_plan: BillingPlan | null
  billing_interval: BillingInterval | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_ends_at: string | null
  stripe_onboarding_completed: boolean | null
  modules: Record<string, any> | null
  stripe_subscription_id: string | null
}

// ── Module definitions ────────────────────────────────────────────────────

const MODULES: ModuleConfig[] = [
  {
    key: 'leadRecovery',
    name: 'Lead Recovery',
    description: 'Automatically follow up with lost leads and recover bookings.',
    icon: <Target className="h-5 w-5" />,
    monthlyPrice: 60,
    annualPrice: 50,
    foundersPrice: 40,
    hasAiToggle: true,
  },
  {
    key: 'jobs',
    name: 'Jobs',
    description: 'Advanced job management, scheduling, and dispatch tools.',
    icon: <Briefcase className="h-5 w-5" />,
    monthlyPrice: 60,
    annualPrice: 50,
    foundersPrice: 40,
  },
  {
    key: 'quickQuote',
    name: 'Quick Quote',
    description: 'Instant quoting tools to convert leads faster.',
    icon: <Zap className="h-5 w-5" />,
    monthlyPrice: 40,
    annualPrice: 33,
    foundersPrice: 27,
  },
  {
    key: 'photos',
    name: 'Photos Studio',
    description: 'Before/after photo galleries and client-ready reports.',
    icon: <Camera className="h-5 w-5" />,
    monthlyPrice: 35,
    annualPrice: 29,
    foundersPrice: 23,
  },
  {
    key: 'mileage',
    name: 'Mileage Tracker',
    description: 'Track mileage for tax deductions and reimbursements.',
    icon: <Navigation className="h-5 w-5" />,
    monthlyPrice: 30,
    annualPrice: 25,
    foundersPrice: 20,
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Track supplies, usage, and reorder alerts.',
    icon: <Package className="h-5 w-5" />,
    monthlyPrice: 20,
    annualPrice: 17,
    foundersPrice: 13,
  },
  {
    key: 'teamManagement',
    name: 'Team Management',
    description: 'Manage multiple detailers, assign jobs, and track performance.',
    icon: <Users className="h-5 w-5" />,
    monthlyPrice: 50,
    annualPrice: 42,
    foundersPrice: 34,
    requiresPro: true,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function getModulePrice(module: ModuleConfig, interval: BillingInterval, aiEnabled?: boolean): number {
  const base = interval === 'annual'
    ? module.annualPrice
    : interval === 'founders'
    ? module.foundersPrice
    : module.monthlyPrice

  if (module.hasAiToggle && aiEnabled) {
    // AI adds $20 on top at each tier
    return base + 20
  }
  return base
}

function isModuleActive(modules: Record<string, any> | null, key: string): boolean {
  if (!modules) return false
  if (key === 'leadRecovery') return modules.leadRecovery?.enabled === true
  return modules[key] === true
}

function isAiActive(modules: Record<string, any> | null): boolean {
  return modules?.leadRecovery?.ai === true
}

// ── Main component ────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    type: 'add' | 'remove' | 'upgrade' | 'downgrade' | 'toggle-ai'
    module?: ModuleConfig
    aiEnabled?: boolean
    title: string
    description: string
    price?: string
    onConfirm: () => void
  }>({ open: false, type: 'add', title: '', description: '', onConfirm: () => {} })

  const supabase = createClient()

  useEffect(() => {
    loadBusiness()
  }, [])

  async function loadBusiness() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('businesses')
        .select('id, billing_plan, billing_interval, subscription_plan, subscription_status, subscription_ends_at, stripe_onboarding_completed, modules, stripe_subscription_id')
        .eq('owner_id', user.id)
        .single()

      setBusiness(data)
    } catch (err) {
      console.error('Error loading business:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const currentPlan: BillingPlan = business?.billing_plan || 'free'
  const interval: BillingInterval = business?.billing_interval || 'monthly'
  const stripeConnected = business?.stripe_onboarding_completed === true
  const isTrialing = business?.subscription_status === 'trialing'
  const trialEndsAt = business?.subscription_ends_at ? new Date(business.subscription_ends_at) : null
  const trialValid = !trialEndsAt || trialEndsAt > new Date()

  // ── Plan actions ────────────────────────────────────────────────────────

  function handleUpgradeToPro() {
    setConfirmModal({
      open: true,
      type: 'upgrade',
      title: 'Upgrade to Pro Plus',
      description: 'You\'ll be charged $100/month starting today. Your booking fee will drop to 2.9% + $0.30.',
      price: '$100/month',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }))
        setActionLoading('plan')
        try {
          // If no subscription yet, go through Stripe Checkout
          if (!business?.stripe_subscription_id) {
            const { data: { user } } = await supabase.auth.getUser()
            const res = await fetch('/api/create-subscription-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planId: 'pro',
                billingPeriod: 'monthly',
                email: user?.email,
                userId: user?.id,
              }),
            })
            const { url } = await res.json()
            if (url) window.location.href = url
          } else {
            // Already has subscription — add Pro item directly
            const res = await fetch('/api/billing/update-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessId: business.id, newPlan: 'pro' }),
            })
            if (!res.ok) throw new Error('Failed to upgrade')
            toast.success('Upgraded to Pro Plus!')
            loadBusiness()
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to upgrade')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  function handleDowngradeToFree() {
    setConfirmModal({
      open: true,
      type: 'downgrade',
      title: 'Downgrade to Free',
      description: 'Your Pro Plus features will remain active until the end of your current billing period. Your booking fee will return to 3.5% + $0.30.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }))
        setActionLoading('plan')
        try {
          const res = await fetch('/api/billing/update-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: business?.id, newPlan: 'free' }),
          })
          if (!res.ok) throw new Error('Failed to downgrade')
          toast.success('Plan downgraded to Free at end of billing period.')
          loadBusiness()
        } catch (err: any) {
          toast.error(err.message || 'Failed to downgrade')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  // ── Module actions ──────────────────────────────────────────────────────

  function handleAddModule(module: ModuleConfig, aiEnabled = false) {
    const price = getModulePrice(module, interval, aiEnabled)
    setConfirmModal({
      open: true,
      type: 'add',
      module,
      aiEnabled,
      title: `Add ${module.name}${aiEnabled ? ' (with AI)' : ''}`,
      description: `You'll be charged a prorated amount today, then $${price}/month going forward.`,
      price: `$${price}/month`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }))
        setActionLoading(module.key)
        try {
          const res = await fetch('/api/billing/toggle-module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: business?.id,
              module: module.key,
              action: 'add',
              aiEnabled,
            }),
          })
          if (!res.ok) throw new Error('Failed to add module')
          toast.success(`${module.name} activated!`)
          loadBusiness()
        } catch (err: any) {
          toast.error(err.message || 'Failed to add module')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  function handleRemoveModule(module: ModuleConfig) {
    const endsAt = trialEndsAt
      ? trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'end of billing period'

    setConfirmModal({
      open: true,
      type: 'remove',
      module,
      title: `Remove ${module.name}`,
      description: `Your access to ${module.name} will continue until ${endsAt} and won't renew after that.`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }))
        setActionLoading(module.key)
        try {
          const res = await fetch('/api/billing/toggle-module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: business?.id,
              module: module.key,
              action: 'remove',
            }),
          })
          if (!res.ok) throw new Error('Failed to remove module')
          toast.success(`${module.name} will be removed at end of billing period.`)
          loadBusiness()
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove module')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  function handleToggleAI(currentlyEnabled: boolean) {
    const newAi = !currentlyEnabled
    const price = getModulePrice(MODULES.find(m => m.key === 'leadRecovery')!, interval, newAi)

    setConfirmModal({
      open: true,
      type: 'toggle-ai',
      title: newAi ? 'Enable AI for Lead Recovery' : 'Disable AI for Lead Recovery',
      description: newAi
        ? `Your Lead Recovery will be upgraded to AI-powered. You'll be charged a prorated amount today, then $${price}/month.`
        : `AI will be disabled. Your Lead Recovery will continue at $${getModulePrice(MODULES.find(m => m.key === 'leadRecovery')!, interval, false)}/month.`,
      price: `$${price}/month`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }))
        setActionLoading('leadRecovery-ai')
        try {
          const res = await fetch('/api/billing/toggle-module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: business?.id,
              module: 'leadRecovery',
              action: 'toggle-ai',
              aiEnabled: newAi,
            }),
          })
          if (!res.ok) throw new Error('Failed to toggle AI')
          toast.success(newAi ? 'AI Lead Recovery enabled!' : 'AI Lead Recovery disabled.')
          loadBusiness()
        } catch (err: any) {
          toast.error(err.message || 'Failed to toggle AI')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block"><GlowBG /></div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Subscription & Add-ons</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/55">
              Manage your plan and add-on modules
            </p>
          </div>

          {/* Trial banner */}
          {isTrialing && trialValid && trialEndsAt && (
            <div className="mb-6 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">Trial active</p>
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  Your free trial ends on {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Select a plan below to continue after your trial.
                </p>
              </div>
            </div>
          )}

          {/* Stripe Connect warning */}
          {!stripeConnected && (
            <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-400">Stripe not connected</p>
                <p className="text-sm text-blue-700 dark:text-blue-500">
                  You&apos;re being charged $20/month as a Platform Access Fee since you haven&apos;t connected Stripe.{' '}
                  <a href="/dashboard/settings?tab=payments" className="underline font-medium">Connect Stripe</a> to remove this fee and use booking-based pricing instead.
                </p>
              </div>
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

            {/* Free Plan */}
            <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-zinc-900 dark:ring-white' : ''}`}>
              {currentPlan === 'free' && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">Free</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-zinc-900 dark:text-white">$0</span>
                  <span className="text-zinc-500">/month</span>
                  {!stripeConnected && (
                    <span className="ml-2 text-sm text-amber-600">+ $20/mo platform fee</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {[
                    'Basic CRM',
                    'Calendar',
                    'Customer & vehicle management',
                    'Unlimited manual jobs',
                    '3.5% + $0.30 booking fee',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                {currentPlan === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDowngradeToFree}
                    disabled={actionLoading === 'plan'}
                  >
                    {actionLoading === 'plan' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Downgrade to Free
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro Plus Plan */}
            <Card className={`relative ${currentPlan === 'pro' ? 'ring-2 ring-indigo-500' : 'border-indigo-200 dark:border-indigo-900'}`}>
              {currentPlan === 'pro' && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-indigo-600 text-white">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Pro Plus</CardTitle>
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">Most Popular</Badge>
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-zinc-900 dark:text-white">$100</span>
                  <span className="text-zinc-500">/month</span>
                  {!stripeConnected && (
                    <span className="ml-2 text-sm text-amber-600">+ $20/mo platform fee</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {[
                    'Everything in Free',
                    'Messaging',
                    'Automations',
                    'Twilio number + $5 credit',
                    '2.9% + $0.30 booking fee',
                    'Access to all modules',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                {currentPlan === 'pro' ? (
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled>Current Plan</Button>
                ) : (
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleUpgradeToPro}
                    disabled={actionLoading === 'plan'}
                  >
                    {actionLoading === 'plan' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Upgrade to Pro Plus
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="mb-8" />

          {/* Modules */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Add-on Modules</h2>
            <p className="text-sm text-zinc-500 dark:text-white/55 mt-1">
              Enhance your plan with optional modules. Billed monthly, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(module => {
              const active = isModuleActive(business?.modules || null, module.key)
              const aiOn = module.hasAiToggle && isAiActive(business?.modules || null)
              const price = getModulePrice(module, interval, aiOn)
              const isLoading = actionLoading === module.key || actionLoading === `${module.key}-ai`
              const locked = module.requiresPro && currentPlan !== 'pro'

              return (
                <Card key={module.key} className={`relative ${active ? 'ring-2 ring-green-500' : ''} ${locked ? 'opacity-60' : ''}`}>
                  {active && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                  )}
                  {locked && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="text-xs">Pro required</Badge>
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {module.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{module.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{module.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-bold">${price}</span>
                        <span className="text-xs text-zinc-500">/mo</span>
                        {module.hasAiToggle && active && (
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {aiOn ? 'AI enabled' : 'Standard'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* AI toggle for Lead Recovery */}
                        {module.hasAiToggle && active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={isLoading || locked}
                            onClick={() => handleToggleAI(!!aiOn)}
                          >
                            {isLoading && actionLoading === `${module.key}-ai`
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : aiOn ? 'Disable AI' : 'Enable AI'
                            }
                          </Button>
                        )}

                        {active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={isLoading}
                            onClick={() => handleRemoveModule(module)}
                          >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200"
                            disabled={isLoading || locked}
                            onClick={() => handleAddModule(module)}
                          >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onOpenChange={o => setConfirmModal(m => ({ ...m, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmModal.title}</DialogTitle>
            <DialogDescription className="pt-2">{confirmModal.description}</DialogDescription>
          </DialogHeader>
          {confirmModal.price && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border p-3 text-center">
              <span className="text-2xl font-bold">{confirmModal.price}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(m => ({ ...m, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={confirmModal.onConfirm}
              className={confirmModal.type === 'remove' || confirmModal.type === 'downgrade'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
