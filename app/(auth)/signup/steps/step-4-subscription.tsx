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
  onBack: () => void
  loading: boolean
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For solo operators getting organized.',
    monthlyPrice: 79,
    yearlyPrice: 790,
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
    baseMonthlyPrice: 149,
    baseYearlyPrice: 1490,
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
    pricingNote: 'Includes up to 2 technicians at $149/mo. Add a 3rd technician for $50/mo.',
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'For multi-vehicle teams needing coordination + oversight.',
    baseMonthlyPrice: 299,
    baseYearlyPrice: 2990,
    features: [
      'Everything in Pro, plus:',
      'Team Management (1–5 techs)',
      'Earnings Tracking (team vs individual performance)',
      'Priority Support (direct line)',
    ],
    color: 'purple',
    maxTeamSize: 5,
    pricingNote: 'Includes up to 3 technicians at $299/mo. Add technicians 4–5 for $50/mo each.',
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
  onBack,
  loading,
}: Step4Props) {
  const calculatePrice = (planId: string, size: number, period: 'monthly' | 'yearly') => {
    if (planId === 'starter') {
      return period === 'monthly' ? 79 : 790
    }
    
    if (planId === 'pro') {
      const base = period === 'monthly' ? 149 : 1490
      // 1-2 techs = base price, 3rd tech = +$50
      if (size <= 2) return base
      return base + (period === 'monthly' ? 50 : 500)
    }
    
    if (planId === 'fleet') {
      const base = period === 'monthly' ? 299 : 2990
      // 1-3 techs = base price, 4th and 5th = +$50 each
      if (size <= 3) return base
      const extraTechs = size - 3
      return base + (extraTechs * (period === 'monthly' ? 50 : 500))
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

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onBillingChange('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onBillingChange('yearly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            billingPeriod === 'yearly'
              ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          Yearly
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
            Save 2 months
          </span>
        </button>
      </div>

      {billingPeriod === 'yearly' && (
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 italic">
          * Yearly plans are billed annually
        </p>
      )}

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
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {billingPeriod === 'yearly' ? '/yr' : '/mo'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 italic mt-1">
                        Billed annually
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        ${isSelected ? calculatedPrice : (billingPeriod === 'monthly' ? plan.baseMonthlyPrice : plan.baseYearlyPrice)}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {billingPeriod === 'yearly' ? '/yr' : '/mo'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 italic mt-1">
                        Billed annually
                      </p>
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
            <option value={1}>1 technician</option>
            <option value={2}>2 technicians (base price)</option>
            <option value={3}>3 technicians (+$50/mo)</option>
          </select>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            Pro includes up to 2 technicians at $149/mo. Add a 3rd technician for $50/mo.
          </p>
          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Total:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${calculatedPrice}
                <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {billingPeriod === 'yearly' ? '/yr' : '/mo'}
                </span>
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
            <option value={1}>1 technician</option>
            <option value={2}>2 technicians</option>
            <option value={3}>3 technicians (base price)</option>
            <option value={4}>4 technicians (+$50/mo)</option>
            <option value={5}>5 technicians (+$100/mo)</option>
          </select>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            Fleet includes up to 3 technicians at $299/mo. Add technicians 4–5 for $50/mo each.
          </p>
          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Total:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${calculatedPrice}
                <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {billingPeriod === 'yearly' ? '/yr' : '/mo'}
                </span>
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

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || !selectedPlan || ((selectedPlan === 'pro' || selectedPlan === 'fleet') && (!teamSize || teamSize === 0))}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </div>
    </div>
  )
}
