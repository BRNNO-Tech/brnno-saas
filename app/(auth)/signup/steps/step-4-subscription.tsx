'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Step4Props {
  selectedPlan: string | null
  onPlanSelect: (plan: string) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started at no cost. Pay only when customers book.',
    price: '$0',
    priceNote: '+ 3.5% per booking',
    features: [
      'Basic CRM',
      'Calendar',
      'Customer & vehicle management',
      'Unlimited manual jobs',
      '3.5% + $0.30 booking fee',
    ],
    color: 'zinc',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Unlock messaging, automations, and lower fees.',
    price: '$100',
    priceNote: '/month',
    popular: true,
    features: [
      'Everything in Free',
      'Messaging',
      'Automations',
      'Twilio number + $5 credit',
      '2.9% + $0.30 booking fee',
      'Access to all modules',
    ],
    color: 'indigo',
  },
]

export default function Step4Subscription({
  selectedPlan,
  onPlanSelect,
  onSubmit,
  onBack,
  loading,
}: Step4Props) {
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
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm">{plan.priceNote}</span>
                </div>
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
          {loading ? 'Setting up...' : selectedPlan === 'free' ? 'Get Started Free' : 'Continue to Payment'}
        </Button>
      </div>
    </div>
  )
}
