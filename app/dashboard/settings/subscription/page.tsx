'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  Camera,
  Navigation,
  Package,
  Receipt,
  Users,
  Loader2,
  AlertCircle,
  Check,
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

/** Cart item for multi-module add (key + optional AI flag for Lead Recovery) */
interface CartModuleItem {
  key: string
  aiEnabled?: boolean
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
    key: 'invoices',
    name: 'Invoices',
    description: 'Discounts, edit invoices, and advanced invoice features.',
    icon: <Receipt className="h-5 w-5" />,
    monthlyPrice: 50,
    annualPrice: 42,
    foundersPrice: 34,
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

  // Cart state for multi-module add
  const [selectedModules, setSelectedModules] = useState<CartModuleItem[]>([])

  // Billing interval for display and new subscriptions ('monthly' | 'annual')
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly')

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    type: 'add' | 'add-cart' | 'remove' | 'upgrade' | 'downgrade' | 'toggle-ai'
    module?: ModuleConfig
    aiEnabled?: boolean
    title: string
    description: string
    price?: string
    onConfirm: () => void
  }>({ open: false, type: 'add', title: '', description: '', onConfirm: () => {} })

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      loadBusiness()
    })
  }, [])

  // Sync selectedInterval from business when loaded; lock for existing subscribers
  useEffect(() => {
    if (!business?.billing_interval) return
    const isAnnual = business.billing_interval === 'annual' || business.billing_interval === 'founders'
    setSelectedInterval(isAnnual ? 'annual' : 'monthly')
  }, [business?.billing_interval])

  async function loadBusiness() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('id, billing_plan, billing_interval, subscription_plan, subscription_status, subscription_ends_at, stripe_onboarding_completed, modules, stripe_subscription_id')
        .eq('owner_id', user.id)
        .single()

      if (error) {
        const status = (error as { status?: number }).status ?? (error as { code?: string }).code ?? 'no status'
        console.error('[subscription] business fetch error:', error, status)
        setLoading(false)
        return
      }

      setBusiness(data)
    } catch (err) {
      const status = (err as { status?: number }).status ?? (err as { code?: string }).code ?? 'no status'
      console.error('[subscription] business fetch error:', err, status)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const currentPlan: BillingPlan = business?.billing_plan || 'free'
  const interval: BillingInterval = business?.billing_interval || 'monthly'
  const hasActiveSubscription = !!business?.stripe_subscription_id
  const displayInterval: BillingInterval = selectedInterval === 'annual' ? 'annual' : 'monthly'
  const stripeConnected = business?.stripe_onboarding_completed === true
  const isTrialing = business?.subscription_status === 'trialing'
  const trialEndsAt = business?.subscription_ends_at ? new Date(business.subscription_ends_at) : null
  const trialValid = !trialEndsAt || trialEndsAt > new Date()

  // ── Cart helpers ────────────────────────────────────────────────────────

  function isModuleInCart(moduleKey: string, aiEnabled?: boolean): boolean {
    return selectedModules.some(
      item => item.key === moduleKey && (moduleKey !== 'leadRecovery' || item.aiEnabled === (aiEnabled ?? false))
    )
  }

  function toggleModuleInCart(module: ModuleConfig, aiEnabled = false) {
    const inCart = isModuleInCart(module.key, module.key === 'leadRecovery' ? aiEnabled : undefined)
    if (inCart) {
      setSelectedModules(prev =>
        prev.filter(
          item =>
            item.key !== module.key ||
            (module.key === 'leadRecovery' && item.aiEnabled !== aiEnabled)
        )
      )
    } else {
      setSelectedModules(prev => [
        ...prev,
        { key: module.key, ...(module.key === 'leadRecovery' ? { aiEnabled } : {}) },
      ])
    }
  }

  function openCartConfirmModal() {
    const items = selectedModules
      .map(item => {
        const mod = MODULES.find(m => m.key === item.key)
        if (!mod) return null
        const price = getModulePrice(mod, displayInterval, item.aiEnabled)
        return { module: mod, aiEnabled: item.aiEnabled ?? false, price }
      })
      .filter(Boolean) as { module: ModuleConfig; aiEnabled: boolean; price: number }[]
    const total = items.reduce((sum, { price }) => sum + price, 0)

    setConfirmModal({
      open: true,
      type: 'add-cart',
      title: 'Add modules',
      description: `You'll be charged a prorated amount today, then the total below per month.`,
      price: `$${total}/month total`,
      onConfirm: async () => {
        const businessId = business?.id
        if (!businessId) {
          toast.error('Something went wrong. Please refresh the page and try again.')
          return
        }
        setActionLoading('cart')
        let failedModule: string | null = null
        try {
          if (!business?.stripe_subscription_id) {
            const res = await fetch('/api/billing/create-module-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessId,
                modules: items.map(({ module: mod, aiEnabled }) => ({
                  key: mod.key,
                  aiEnabled: aiEnabled ?? false,
                })),
              }),
            })
            const result = await res.json().catch(() => ({}))
            if (result.checkoutUrl) {
              window.location.href = result.checkoutUrl
              return
            }
            if (!res.ok) {
              throw new Error((result as { error?: string }).error || 'Failed to create checkout')
            }
            return
          }
          for (const { module: mod, aiEnabled } of items) {
            const res = await fetch('/api/billing/toggle-module', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessId,
                module: mod.key,
                action: 'add',
                aiEnabled: aiEnabled ?? false,
              }),
            })
            const result = await res.json().catch(() => ({}))
            if (result.checkoutUrl) {
              window.location.href = result.checkoutUrl
              return
            }
            if (!res.ok) {
              failedModule = mod.name
              throw new Error((result as { error?: string }).error || `Failed to add ${mod.name}`)
            }
          }
          setConfirmModal(m => ({ ...m, open: false }))
          setSelectedModules([])
          await loadBusiness()
          toast.success(`${items.length} module(s) added!`)
        } catch (err: any) {
          toast.error(failedModule ? `Failed to add ${failedModule}. ${err.message || ''}` : err.message || 'Failed to add modules')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  // ── Plan actions ────────────────────────────────────────────────────────

  function handleUpgradeToPro() {
    const priceLabel = selectedInterval === 'monthly' ? '$100/month' : '$84/mo billed annually'
    setConfirmModal({
      open: true,
      type: 'upgrade',
      title: 'Upgrade to Pro',
      description: selectedInterval === 'monthly'
        ? 'You\'ll be charged $100/month starting today. Your booking fee will drop to 2.9% + $0.30.'
        : 'You\'ll be charged $84/mo (billed annually) starting today. Your booking fee will drop to 2.9% + $0.30.',
      price: priceLabel,
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
                billingPeriod: selectedInterval === 'annual' ? 'yearly' : 'monthly',
                interval: selectedInterval,
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
            toast.success('Upgraded to Pro!')
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
      description: 'Your Pro features will remain active until the end of your current billing period. Your booking fee will return to 3.5% + $0.30.',
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
    const price = getModulePrice(module, displayInterval, aiEnabled)
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
          const result = await res.json().catch(() => ({}))
          if ((result as { checkoutUrl?: string }).checkoutUrl) {
            window.location.href = (result as { checkoutUrl: string }).checkoutUrl
            return
          }
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
    const price = getModulePrice(MODULES.find(m => m.key === 'leadRecovery')!, displayInterval, newAi)

    setConfirmModal({
      open: true,
      type: 'toggle-ai',
      title: newAi ? 'Enable AI for Lead Recovery' : 'Disable AI for Lead Recovery',
      description: newAi
        ? `Your Lead Recovery will be upgraded to AI-powered. You'll be charged a prorated amount today, then $${price}/month.`
        : `AI will be disabled. Your Lead Recovery will continue at $${getModulePrice(MODULES.find(m => m.key === 'leadRecovery')!, displayInterval, false)}/month.`,
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
        <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-text-muted)]" />
      </div>
    )
  }

  return (
    <div className={`w-full space-y-6 ${selectedModules.length > 0 ? 'pb-28' : 'pb-20 md:pb-0'}`}>
      {/* Header */}
      <div>
        <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
          Subscription & Add-ons
        </h1>
        <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
          Manage your plan and add-on modules
        </p>
      </div>

      {/* Billing interval toggle: Monthly | Yearly (save 20%) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded border border-[var(--dash-border)] bg-[var(--dash-surface)] p-0.5">
          <button
            type="button"
            onClick={() => !hasActiveSubscription && setSelectedInterval('monthly')}
            className={`px-4 py-2 font-dash-mono text-[11px] uppercase tracking-wider rounded transition-colors ${
              selectedInterval === 'monthly'
                ? 'bg-[var(--dash-amber)] text-[var(--dash-black)] font-bold'
                : hasActiveSubscription
                  ? 'text-[var(--dash-text-dim)] cursor-not-allowed opacity-60'
                  : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]'
            }`}
            disabled={hasActiveSubscription}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => !hasActiveSubscription && setSelectedInterval('annual')}
            className={`px-4 py-2 font-dash-mono text-[11px] uppercase tracking-wider rounded transition-colors ${
              selectedInterval === 'annual'
                ? 'bg-[var(--dash-amber)] text-[var(--dash-black)] font-bold'
                : hasActiveSubscription
                  ? 'text-[var(--dash-text-dim)] cursor-not-allowed opacity-60'
                  : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]'
            }`}
            disabled={hasActiveSubscription}
          >
            Yearly (save 20%)
          </button>
        </div>
        {hasActiveSubscription && (
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            To change billing interval, contact support
          </span>
        )}
      </div>

      {/* Trial banner */}
      {isTrialing && trialValid && trialEndsAt && (
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4 flex items-start gap-3 border-l-4 border-l-[var(--dash-amber)]">
          <AlertCircle className="h-5 w-5 text-[var(--dash-amber)] mt-0.5 shrink-0" />
          <div>
            <p className="font-dash-condensed font-bold text-[var(--dash-text)]">Trial active</p>
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-0.5">
              Your free trial ends on {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Select a plan below to continue after your trial.
            </p>
          </div>
        </div>
      )}

      {/* Stripe Connect warning */}
      {!stripeConnected && (
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4 flex items-start gap-3 border-l-4 border-l-[var(--dash-amber)]">
          <AlertCircle className="h-5 w-5 text-[var(--dash-amber)] mt-0.5 shrink-0" />
          <div>
            <p className="font-dash-condensed font-bold text-[var(--dash-text)]">Stripe not connected</p>
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-0.5">
              You&apos;re being charged $20/month as a Platform Access Fee since you haven&apos;t connected Stripe.{' '}
              <a href="/dashboard/settings?tab=payments" className="text-[var(--dash-amber)] hover:underline font-medium">Connect Stripe</a> to remove this fee and use booking-based pricing instead.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <div className={`relative border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 ${currentPlan === 'free' ? 'ring-2 ring-[var(--dash-amber)]' : ''}`}>
          {currentPlan === 'free' && (
            <div className="absolute -top-2.5 left-4">
              <span className="inline-flex items-center px-2 py-0.5 font-dash-mono text-[9px] uppercase tracking-wider bg-[var(--dash-amber)] text-[var(--dash-black)]">Current Plan</span>
            </div>
          )}
          <div className="mb-4">
            <h2 className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-text)]">Free</h2>
            <p className="mt-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              <span className="font-dash-condensed font-bold text-2xl text-[var(--dash-text)]">$0</span>
              <span className="text-[var(--dash-text-muted)]">/month</span>
            </p>
          </div>
          <ul className="space-y-2 mb-6">
            {['Free when Stripe connected', 'Customer management', 'Service management', 'Job management', 'Basic invoicing', 'Calendar', 'Booking and Business profiles', ...(!stripeConnected ? ['If Stripe not connected: +$20/mo platform fee'] : [])].map(f => (
              <li key={f} className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                {f.startsWith('If Stripe') ? (
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--dash-amber)] shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--dash-green)] shrink-0" />
                )}
                <span className={f.startsWith('If Stripe') ? 'text-[var(--dash-amber)]' : ''}>{f}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'free' ? (
            <Button variant="outline" className="w-full border-[var(--dash-border)] text-[var(--dash-text-muted)] font-dash-condensed font-bold text-[12px] uppercase" disabled>Current Plan</Button>
          ) : (
            <Button
              variant="outline"
              className="w-full border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] font-dash-condensed font-bold text-[12px] uppercase"
              onClick={handleDowngradeToFree}
              disabled={actionLoading === 'plan'}
            >
              {actionLoading === 'plan' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              Downgrade to Free
            </Button>
          )}
        </div>

        {/* Pro Plan */}
        <div className={`relative border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 ${currentPlan === 'pro' ? 'ring-2 ring-[var(--dash-amber)]' : ''} border-[var(--dash-border-bright)]`}>
          {currentPlan === 'pro' && (
            <div className="absolute -top-2.5 left-4">
              <span className="inline-flex items-center px-2 py-0.5 font-dash-mono text-[9px] uppercase tracking-wider bg-[var(--dash-amber)] text-[var(--dash-black)]">Current Plan</span>
            </div>
          )}
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-text)]">Pro</h2>
              <p className="mt-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                {selectedInterval === 'monthly' ? (
                  <>
                    <span className="font-dash-condensed font-bold text-2xl text-[var(--dash-text)]">$100</span>
                    <span className="text-[var(--dash-text-muted)]">/month</span>
                  </>
                ) : (
                  <>
                    <span className="font-dash-condensed font-bold text-2xl text-[var(--dash-text)]">$84</span>
                    <span className="text-[var(--dash-text-muted)]">/mo billed annually</span>
                    <span className="block line-through text-[var(--dash-text-dim)]">$100/month</span>
                  </>
                )}
              </p>
            </div>
            <span className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-amber)] border border-[var(--dash-amber)] px-2 py-0.5">Most Popular</span>
          </div>
          <ul className="space-y-2 mb-6">
            {['Everything in Free', 'Personalized branded profiles', '2 Way Messaging', 'Twilio number + $5 credit ($30 one-time fee)', 'Lower booking fee (2.9% + $0.30)', 'Access to AI Lead Recovery', 'Invoicing (Smart Invoicing requires module)', ...(!stripeConnected ? ['If Stripe not connected: +$20/mo platform fee'] : [])].map(f => (
              <li key={f} className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                {f.startsWith('If Stripe') ? (
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--dash-amber)] shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--dash-amber)] shrink-0" />
                )}
                <span className={f.startsWith('If Stripe') ? 'text-[var(--dash-amber)]' : ''}>{f}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'pro' ? (
            <Button className="w-full bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[12px] uppercase hover:opacity-90" disabled>Current Plan</Button>
          ) : (
            <Button
              className="w-full bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[12px] uppercase hover:opacity-90"
              onClick={handleUpgradeToPro}
              disabled={actionLoading === 'plan'}
            >
              {actionLoading === 'plan' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      {/* Modules section header */}
      <div className="border-t border-[var(--dash-border)] pt-6">
        <h2 className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-text)]">Add-on Modules</h2>
        <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
          Enhance your plan with optional modules. Billed monthly, cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map(module => {
          const active = isModuleActive(business?.modules || null, module.key)
          const aiOn = module.hasAiToggle && isAiActive(business?.modules || null)
          const price = getModulePrice(module, displayInterval, aiOn)
          const monthlyPrice = getModulePrice(module, 'monthly', aiOn)
          const isLoading = actionLoading === module.key || actionLoading === `${module.key}-ai`
          const locked = module.requiresPro && currentPlan !== 'pro'

          return (
            <div
              key={module.key}
              className={`relative border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-5 ${active ? 'ring-1 ring-[var(--dash-green)]' : ''} ${locked ? 'opacity-60' : ''}`}
            >
              {active && (
                <div className="absolute -top-2.5 left-4">
                  <span className="inline-flex items-center px-2 py-0.5 font-dash-mono text-[9px] uppercase tracking-wider bg-[var(--dash-green)] text-[var(--dash-black)]">Active</span>
                </div>
              )}
              {locked && (
                <div className="absolute -top-2.5 right-4">
                  <span className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-dim)] border border-[var(--dash-border)] px-2 py-0.5">Pro required</span>
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)]">
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dash-condensed font-bold text-sm uppercase text-[var(--dash-text)]">{module.name}</p>
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5 leading-snug">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
                <div>
                  {selectedInterval === 'monthly' ? (
                    <>
                      <span className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">${price}</span>
                      <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">/mo</span>
                    </>
                  ) : (
                    <>
                      <span className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">${price}</span>
                      <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">/mo billed annually</span>
                      {monthlyPrice !== price && (
                        <span className="block font-dash-mono text-[10px] text-[var(--dash-text-dim)] line-through">${monthlyPrice}/mo</span>
                      )}
                    </>
                  )}
                  {module.hasAiToggle && active && (
                    <div className="font-dash-mono text-[10px] text-[var(--dash-text-dim)] mt-0.5">
                      {aiOn ? 'AI enabled' : 'Standard'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {module.hasAiToggle && active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-dash-mono text-[10px] border-[var(--dash-border)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]"
                      disabled={isLoading || locked}
                      onClick={() => handleToggleAI(!!aiOn)}
                    >
                      {isLoading && actionLoading === `${module.key}-ai` ? <Loader2 className="h-3 w-3 animate-spin" /> : aiOn ? 'Disable AI' : 'Enable AI'}
                    </Button>
                  )}
                  {active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-dash-mono text-[10px] border-[var(--dash-border)] text-[var(--dash-text-muted)] hover:border-red-500/80 hover:text-red-400"
                      disabled={isLoading}
                      onClick={() => handleRemoveModule(module)}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove'}
                    </Button>
                  ) : isModuleInCart(module.key, module.key === 'leadRecovery' ? aiOn : undefined) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-dash-mono text-[10px] border-[var(--dash-green)] text-[var(--dash-green)] hover:border-[var(--dash-green)] hover:bg-[var(--dash-green)]/10"
                      disabled={isLoading || locked}
                      onClick={() => toggleModuleInCart(module, module.key === 'leadRecovery' ? aiOn : false)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase hover:opacity-90"
                      disabled={isLoading || locked}
                      onClick={() => toggleModuleInCart(module, module.key === 'leadRecovery' ? aiOn : false)}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart summary bar — sticky when modules selected */}
      {selectedModules.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4 flex flex-wrap items-center justify-between gap-3 md:px-6">
          <div className="flex items-center gap-4">
            <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
              {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
            </span>
            <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              <span className="font-dash-condensed font-bold text-[var(--dash-amber)]">
                $
                {selectedModules
                  .reduce((sum, item) => {
                    const mod = MODULES.find(m => m.key === item.key)
                    return sum + (mod ? getModulePrice(mod, displayInterval, item.aiEnabled) : 0)
                  }, 0)
                  .toFixed(0)}
                /mo
              </span>
              {' total'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--dash-border)] text-[var(--dash-text-muted)] font-dash-mono text-[11px] uppercase hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]"
              onClick={() => setSelectedModules([])}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase hover:opacity-90 disabled:opacity-50"
              disabled={actionLoading === 'cart'}
              onClick={openCartConfirmModal}
            >
              {actionLoading === 'cart' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              Add modules
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal — light text on dark background for visibility */}
      <Dialog open={confirmModal.open} onOpenChange={o => !actionLoading && setConfirmModal(m => ({ ...m, open: o }))}>
        <DialogContent
          className="border border-[var(--dash-border)] shadow-2xl sm:rounded-lg bg-[#111111] text-white"
        >
          <DialogHeader>
            <DialogTitle className="font-dash-condensed font-extrabold uppercase text-white">
              {confirmModal.title}
            </DialogTitle>
            <DialogDescription className="pt-2 font-dash-mono text-[11px] text-gray-300">
              {confirmModal.description}
            </DialogDescription>
          </DialogHeader>
          {confirmModal.type === 'add-cart' && selectedModules.length > 0 && (
            <div className="rounded border border-gray-600 bg-[#181818] p-3 space-y-2 max-h-48 overflow-y-auto">
              {selectedModules.map(item => {
                const mod = MODULES.find(m => m.key === item.key)
                if (!mod) return null
                const price = getModulePrice(mod, displayInterval, item.aiEnabled)
                return (
                  <div key={item.key} className="flex justify-between items-center font-dash-mono text-[11px]">
                    <span className="text-gray-200">
                      {mod.name}
                      {mod.key === 'leadRecovery' && item.aiEnabled ? ' (with AI)' : ''}
                    </span>
                    <span className="text-white font-dash-condensed font-bold">${price}/mo</span>
                  </div>
                )
              })}
            </div>
          )}
          {confirmModal.price && (
            <div className="rounded border border-gray-600 bg-[#181818] p-3 text-center">
              <span className="font-dash-condensed font-bold text-2xl text-white">{confirmModal.price}</span>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
              disabled={actionLoading === 'cart'}
              className="border-gray-500 text-gray-300 font-dash-condensed font-bold text-[12px] uppercase hover:border-amber-500 hover:text-amber-400 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmModal.onConfirm}
              disabled={actionLoading === 'cart'}
              className={confirmModal.type === 'remove' || confirmModal.type === 'downgrade'
                ? 'bg-red-600 hover:bg-red-700 text-white font-dash-condensed font-bold text-[12px] uppercase'
                : 'bg-amber-500 text-black font-dash-condensed font-bold text-[12px] uppercase hover:opacity-90 disabled:opacity-50'
              }
            >
              {actionLoading === 'cart' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Adding…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
