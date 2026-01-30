'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Step4Props {
  selectedPlan: string | null
  billingPeriod: 'monthly' | 'yearly'
  teamSize: number
  onPlanSelect: (plan: string) => void
  onBillingChange: (period: 'monthly' | 'yearly') => void
  onTeamSizeChange: (size: number) => void
  onSubmit: () => void
  onStartTrial: () => void
  onBack: () => void
  loading: boolean
  trialLoading: boolean
}

// Prices aligned with landing page (App.tsx): per-month display; yearly = discounted per-month, "Billed annually"
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For solo operators getting organized.',
    monthlyPrice: 89,
    yearlyPrice: 74, // per month when billed annually (Save ~17%)
    features: [
      'Instant Booking (customer portal)',
      'Upfront Payments (deposits or full amount)',
      'Basic Jobs View (today\'s schedule)',
      'Lead Recovery: Limited',
    ],
    color: 'green',
    maxTeamSize: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Automation + revenue tools.',
    features: [
      'Everything in Starter, plus:',
      'Full Automation (reviews, follow-ups, rebook reminders)',
      'Advanced Quotes & Invoices',
      'Reports (monthly revenue + top services)',
      'Custom Service Menus',
      'Team Management (1–3 techs)',
      'Lead Recovery Dashboard (Hot/Warm/Cold tracking)',
    ],
    color: 'blue',
    popular: true,
    maxTeamSize: 3,
    pricingRanges: {
      monthly: { '1-2': 169, '3': 199 },
      yearly: { '1-2': 141, '3': 166 }, // per month when billed annually
    },
    pricingNote: '1-2 technicians: $169/mo. 3 technicians: $199/mo.',
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'For multi-vehicle teams needing coordination + oversight.',
    features: [
      'Everything in Pro, plus:',
      'Team Management (1–5 techs)',
      'Earnings Tracking (team vs individual performance)',
      'Priority Support (direct line)',
    ],
    color: 'purple',
    maxTeamSize: 5,
    pricingRanges: {
      monthly: { '1-3': 299, '4-5': 399 },
      yearly: { '1-3': 249, '4-5': 332 }, // per month when billed annually
    },
    pricingNote: '1-3 technicians: $299/mo. 4-5 technicians: $399/mo.',
  },
]

export default function Step4Subscription({
  selectedPlan,
  billingPeriod,
  teamSize,
  onPlanSelect,
  onBillingChange,
  onTeamSizeChange,
  onSubmit,
  onStartTrial,
  onBack,
  loading,
  trialLoading,
}: Step4Props) {
  const calculatePrice = (planId: string, size: number, period: 'monthly' | 'yearly') => {
    if (planId === 'starter') {
      return period === 'monthly' ? 89 : 74
    }
    if (planId === 'pro') {
      const ranges = plans.find(p => p.id === 'pro')?.pricingRanges
      if (!ranges) return 0
      return size <= 2 ? ranges[period]['1-2'] : ranges[period]['3']
    }
    if (planId === 'fleet') {
      const ranges = plans.find(p => p.id === 'fleet')?.pricingRanges
      if (!ranges) return 0
      return size <= 3 ? ranges[period]['1-3'] : ranges[period]['4-5']
    }
    return 0
  }

  const getColorClasses = (color: string, isSelected: boolean, isPopular?: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'green':
          return 'border-green-500 bg-green-50 dark:bg-green-950/20'
        case 'blue':
          return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
        case 'purple':
          return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
        default:
          return 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
      }
    }
    return 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const calculatedPrice = selectedPlan ? calculatePrice(selectedPlan, teamSize, billingPeriod) : 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Choose your plan
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Step 4 of 4: Select a subscription plan to get started
        </p>
      </div>

      {/* Billing Toggle - same style as landing page (per-month display, yearly = discounted) */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'}`}>Monthly</span>
        <button
          type="button"
          onClick={() => onBillingChange(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full p-1 relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-zinc-50 dark:focus:ring-offset-zinc-950"
        >
          <div className={`w-6 h-6 bg-brand-600 dark:bg-brand-500 rounded-full shadow-md transform transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'}`}>
          Yearly <span className="text-brand-600 dark:text-brand-400 text-xs ml-1">(Save 20%)</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const price = plan.id === 'starter' 
            ? (billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)
            : calculatePrice(plan.id, teamSize, billingPeriod)

          return (
            <div
              key={plan.id}
              onClick={() => {
                onPlanSelect(plan.id)
                // Set default team size when selecting plan
                if (plan.id === 'pro' && teamSize === 0) onTeamSizeChange(2)
                if (plan.id === 'fleet' && teamSize === 0) onTeamSizeChange(3)
              }}
              className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all min-w-0 flex flex-col ${
                isSelected ? 'ring-2 ring-offset-2' : ''
              } ${getColorClasses(plan.color, isSelected, plan.popular)}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-4">
                {plan.id === 'starter' ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        ${price}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">/mo</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Billed annually</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        ${isSelected ? calculatedPrice : (plan.pricingRanges?.[billingPeriod]?.[plan.id === 'pro' ? '1-2' : '1-3'] || 0)}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">/mo</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Billed annually</p>
                    )}
                    {plan.pricingNote && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                        {plan.pricingNote}
                      </p>
                    )}
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-4 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300 break-words">{feature}</span>
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Team Size Selector for Pro */}
      {selectedPlan === 'pro' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Label htmlFor="pro-team-size" className="mb-2 block text-sm font-medium">
            How many technicians? (1-3)
          </Label>
          <select
            id="pro-team-size"
            value={teamSize || 2}
            onChange={(e) => onTeamSizeChange(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-zinc-50"
          >
            <option value={1}>1 technician (${billingPeriod === 'monthly' ? '169' : '141'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={2}>2 technicians (${billingPeriod === 'monthly' ? '169' : '141'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={3}>3 technicians (${billingPeriod === 'monthly' ? '199' : '166'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
          </select>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            Pro: 1-2 techs = ${billingPeriod === 'monthly' ? '169' : '141'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''}. 3 techs = ${billingPeriod === 'monthly' ? '199' : '166'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''}.
          </p>
          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Total:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${calculatedPrice}<span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">/mo</span>
                {billingPeriod === 'yearly' && <span className="text-xs text-brand-600 dark:text-brand-400 block">Billed annually</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team Size Selector for Fleet */}
      {selectedPlan === 'fleet' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Label htmlFor="fleet-team-size" className="mb-2 block text-sm font-medium">
            How many technicians? (1-5)
          </Label>
          <select
            id="fleet-team-size"
            value={teamSize || 3}
            onChange={(e) => onTeamSizeChange(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-zinc-50"
          >
            <option value={1}>1 technician (${billingPeriod === 'monthly' ? '299' : '249'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={2}>2 technicians (${billingPeriod === 'monthly' ? '299' : '249'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={3}>3 technicians (${billingPeriod === 'monthly' ? '299' : '249'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={4}>4 technicians (${billingPeriod === 'monthly' ? '399' : '332'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
            <option value={5}>5 technicians (${billingPeriod === 'monthly' ? '399' : '332'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''})</option>
          </select>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            Fleet: 1-3 techs = ${billingPeriod === 'monthly' ? '299' : '249'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''}. 4-5 techs = ${billingPeriod === 'monthly' ? '399' : '332'}/mo{billingPeriod === 'yearly' ? ' billed annually' : ''}.
          </p>
          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Total:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${calculatedPrice}<span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">/mo</span>
                {billingPeriod === 'yearly' && <span className="text-xs text-brand-600 dark:text-brand-400 block">Billed annually</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {!selectedPlan && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          Please select a plan to continue
        </p>
      )}

      {selectedPlan && (selectedPlan === 'pro' || selectedPlan === 'fleet') && (!teamSize || teamSize === 0) && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          Please select team size
        </p>
      )}

      <div className="space-y-3">
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading || trialLoading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onStartTrial}
            disabled={loading || trialLoading || !selectedPlan || ((selectedPlan === 'pro' || selectedPlan === 'fleet') && (!teamSize || teamSize === 0))}
            variant="secondary"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
          >
            {trialLoading ? 'Starting Trial...' : 'Start Free Trial (14 Days)'}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading || trialLoading || !selectedPlan || ((selectedPlan === 'pro' || selectedPlan === 'fleet') && (!teamSize || teamSize === 0))}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
          Start your 14-day free trial with full access. No credit card required.
        </p>
      </div>
    </div>
  )
}
