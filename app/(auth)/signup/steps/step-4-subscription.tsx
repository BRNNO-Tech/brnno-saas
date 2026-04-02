'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ProBillingInterval = 'monthly' | 'annual'

interface Step4Props {
  selectedPlan: string | null
  proBillingInterval: ProBillingInterval
  proStripeConnect: boolean
  onPlanSelect: (plan: string) => void
  onProBillingIntervalChange: (v: ProBillingInterval) => void
  onProStripeConnectChange: (v: boolean) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

const freeFeatures = [
  'Customer management',
  'Service management',
  'Job management',
  'Invoicing',
  'Calendar',
  'Booking and business profiles',
  'Booking fee: 3.5% + $0.30 per transaction',
]

const proFeatures = [
  'Everything in Free, plus:',
  '2-way messaging',
  'Custom branding',
  'Twilio number + $5 credits/month',
  'Smart Invoicing',
  'AI Assistant + AI features across modules',
  'Booking fee: 2.9% + $0.30 per transaction',
]

export default function Step4Subscription({
  selectedPlan,
  proBillingInterval,
  proStripeConnect,
  onPlanSelect,
  onProBillingIntervalChange,
  onProStripeConnectChange,
  onSubmit,
  onBack,
  loading,
}: Step4Props) {
  // Only strict true uses Connect pricing; default false/undefined → higher tier ($70 / $680)
  const useStripeConnectRate = proStripeConnect === true
  const connectMonthly = 50
  const connectAnnual = 480
  const noConnectMonthly = 70
  const noConnectAnnual = 680
  const monthly = useStripeConnectRate ? connectMonthly : noConnectMonthly
  const annual = useStripeConnectRate ? connectAnnual : noConnectAnnual
  const annualSavings = useStripeConnectRate ? 120 : 160

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Get started at no cost. Pay booking fees only when customers pay through BRNNO.',
      price: '$0',
      priceNote: '/month',
      features: freeFeatures,
      color: 'zinc',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: useStripeConnectRate
        ? 'Stripe Connect rate — same Pro features, lowest subscription price.'
        : 'Higher subscription price — use the options above if you’ll use Stripe Connect and want $50/mo instead.',
      price: proBillingInterval === 'monthly' ? `$${monthly}` : `$${Math.round(annual / 12)}`,
      priceNote:
        proBillingInterval === 'monthly'
          ? '/month'
          : `/mo billed annually ($${annual}/yr)`,
      savingsNote:
        proBillingInterval === 'annual' ? `Save $${annualSavings}/year vs monthly` : null,
      popular: true,
      features: proFeatures,
      color: 'indigo',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Choose your plan
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Step 4 of 4: Select a plan to get started
        </p>
      </div>

      {selectedPlan === 'pro' && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Pro rate — pick one
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              This choice sets your subscription price. Most detailers use Stripe Connect for payouts through BRNNO — that&apos;s the{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">lower</span> price. If you don&apos;t select it, you pay the higher Pro rate.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Pro pricing tier">
            <button
              type="button"
              role="radio"
              aria-checked={useStripeConnectRate}
              onClick={() => onProStripeConnectChange(true)}
              className={`w-full text-left rounded-lg border-2 p-3 transition-colors ${
                useStripeConnectRate
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                  : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 rounded-full border-2 ${
                    useStripeConnectRate ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {useStripeConnectRate ? <span className="m-auto block h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Stripe Connect for payouts — $50/mo or $480/yr
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Recommended. Connect Stripe after signup under Settings → Payments. Same Pro features, lower subscription price.
                  </span>
                </span>
              </div>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!useStripeConnectRate}
              onClick={() => onProStripeConnectChange(false)}
              className={`w-full text-left rounded-lg border-2 p-3 transition-colors ${
                !useStripeConnectRate
                  ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/25 ring-1 ring-amber-500/25'
                  : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 rounded-full border-2 ${
                    !useStripeConnectRate ? 'border-amber-600 bg-amber-600' : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {!useStripeConnectRate ? <span className="m-auto block h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Without Stripe Connect — $70/mo or $680/yr
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Default if you&apos;re unsure — but if you plan to use Stripe for payouts, choose the option above to save $20/mo ($240/yr).
                  </span>
                </span>
              </div>
            </button>
          </div>

          {!useStripeConnectRate && (
            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100">
              <span className="font-semibold">You&apos;re about to subscribe at the higher Pro rate.</span>{' '}
              If you intend to use Stripe Connect with BRNNO, switch to the first option — otherwise you&apos;ll pay an extra $20/mo for the same features.
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Billing cycle
            </p>
            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-600 p-0.5 bg-white dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => onProBillingIntervalChange('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  proBillingInterval === 'monthly'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onProBillingIntervalChange('annual')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  proBillingInterval === 'annual'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const borderColor = isSelected
            ? plan.color === 'indigo'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 ring-2 ring-indigo-500 ring-offset-2'
              : 'border-zinc-900 bg-zinc-50 dark:bg-zinc-900 ring-2 ring-zinc-900 dark:ring-white ring-offset-2'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'

          return (
            <div
              key={plan.id}
              onClick={() => onPlanSelect(plan.id)}
              className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all flex flex-col ${borderColor}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{plan.description}</p>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm">{plan.priceNote}</span>
                </div>
                {'savingsNote' in plan && plan.savingsNote && (
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {plan.savingsNote}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-4 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.color === 'indigo' ? 'text-indigo-500' : 'text-green-500'}`} />
                    <span className="text-zinc-700 dark:text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="mt-4 text-center">
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${plan.color === 'indigo' ? 'text-indigo-600' : 'text-zinc-900 dark:text-white'}`}>
                    <Check className="h-5 w-5" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!selectedPlan && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          Please select a plan to continue
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
          disabled={loading || !selectedPlan}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading
            ? 'Setting up...'
            : selectedPlan === 'free'
              ? 'Get Started Free'
              : selectedPlan === 'pro'
                ? proBillingInterval === 'monthly'
                  ? `Continue to payment — $${useStripeConnectRate ? 50 : 70}/mo`
                  : `Continue to payment — $${useStripeConnectRate ? 480 : 680}/yr`
                : 'Choose a plan'}
        </Button>
      </div>
    </div>
  )
}
