'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PricingCard from './pricing-card'

// Helper function to extract lowest price from a range
const extractLowestPrice = (priceString: string): string => {
  // Handle special cases
  if (priceString === "Let's Talk" || priceString.startsWith('From ')) {
    return priceString
  }

  // Extract the first price from ranges like "$149–$199" or "$1,490–$1,990"
  const match = priceString.match(/^\$?([\d,]+)/)
  if (match) {
    return `$${match[1]}`
  }

  return priceString
}

type PricingPlan = {
  name: string
  color: 'green' | 'blue' | 'purple' | 'gray'
  description: string
  monthlyPrice: string
  yearlyPrice?: string | null
  yearlySavings?: string
  features: string[]
  bestFor?: string
  cta: string
  href: string
  popular?: boolean
  highlight?: boolean
  dark?: boolean
  accent?: boolean
  aiAddons?: string[]
}

const plans: PricingPlan[] = [
  {
    name: 'Basic',
    color: 'green' as const,
    description: 'For solo operators who need a clean booking system and simple job management.',
    monthlyPrice: '$89.99',
    yearlyPrice: '$74.99',
    yearlySavings: 'billed annually at $899.99',
    features: [
      'Online booking system',
      'Upfront payments',
      'Customer & job management',
      'Basic quotes & invoices',
      'Today\'s schedule view',
      'Limited lead recovery (20 leads)',
      'Manual job assignment',
    ],
    bestFor: 'New detailers, solo operators, and small service providers.',
    cta: 'Get Basic',
    href: '/signup',
  },
  {
    name: 'Pro',
    color: 'blue' as const,
    description: 'For growing teams who want automation, lead recovery, and team management.',
    monthlyPrice: '$169.99',
    yearlyPrice: '$141.66',
    yearlySavings: 'billed annually at $1,699.99',
    popular: true,
    highlight: true,
    features: [
      'Everything in Basic, plus:',
      'Full lead recovery system',
      'Unlimited leads',
      'Automation suite (reviews, follow-ups, rebook reminders)',
      'Team dashboard',
      'Basic auto-assignment',
      'Advanced quotes & invoices',
      'Monthly revenue & service reports',
      'PDF export',
    ],
    bestFor: 'Teams scaling to 2–3 techs who want automation and better conversions.',
    cta: 'Upgrade to Pro',
    href: '/signup',
  },
  {
    name: 'Fleet',
    color: 'purple' as const,
    description: 'For multi‑tech teams who need advanced routing, analytics, and enterprise tools.',
    monthlyPrice: '$299.99',
    yearlyPrice: '$249.99',
    yearlySavings: 'billed annually at $2,999.99',
    features: [
      'Everything in Pro, plus:',
      'Earnings tracking',
      'Advanced auto-assignment',
      'Route optimization',
      'Priority support',
      'API access',
      'Advanced analytics',
    ],
    bestFor: 'High‑volume operators, multi‑van teams, and businesses needing deeper control.',
    cta: 'Get Fleet',
    href: '/signup',
  },
  {
    name: 'Custom',
    color: 'gray' as const,
    description: 'Tailored to your needs',
    monthlyPrice: "Let's Talk",
    yearlyPrice: null,
    features: [
      'Custom feature development',
      'Full white-label branding',
      'Multi-location support',
      'Enterprise SSO',
      'SLA guarantees',
      'Dedicated account manager',
      'On-site or virtual training',
      'API access & developer support',
      'Custom integrations',
      'Advanced reporting suite',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    dark: true,
  },
  {
    name: 'Market Suite',
    color: 'gray' as const,
    description: 'ADD‑ONS (Optional, Modular, Scalable)',
    monthlyPrice: 'From $9.99',
    yearlyPrice: null,
    features: [
      'AI Photo Analysis ($19.99/mo)',
      'Mileage Tracker ($9.99/mo)',
      'AI Power Pack ($99–$149/mo)',
      'SMS/Text Messaging ($29/mo)',
      'White Label ($99/mo)',
      'Custom Domain ($19/mo)',
    ],
    cta: 'View Market Suite',
    href: '/ai-suite',
    accent: true,
  },
]

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const cardWidth = 360 // Card width + gap
    const scrollAmount = cardWidth

    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-900/50 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Pricing Plans</h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 px-4 mb-6">
            Choose the plan that fits your detailing business.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Yearly
            </span>
          </div>

          <p className="mt-2 text-base text-blue-600 dark:text-blue-400 font-medium px-4">
            Need help deciding on a package? <a href="/contact" className="underline hover:text-blue-800 dark:hover:text-blue-300">Contact us for help!</a>
          </p>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative overflow-visible">
          {/* Scroll Hint for Mobile */}
          <div className="md:hidden text-center mb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">← Swipe to see all plans →</p>
          </div>

          {/* Arrow Buttons */}
          <div className="hidden md:flex items-center justify-between absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none px-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white dark:bg-zinc-900 shadow-lg border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 pointer-events-auto"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white dark:bg-zinc-900 shadow-lg border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 pointer-events-auto"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar px-4 md:px-0"
          >
            {plans.map((plan) => {
              const rawPrice = billingPeriod === 'monthly'
                ? plan.monthlyPrice
                : (plan.yearlyPrice || plan.monthlyPrice)

              // Extract lowest price and format with "Starting at"
              const lowestPrice = extractLowestPrice(rawPrice)
              const showStartingAt = rawPrice !== "Let's Talk" && !rawPrice.startsWith('From ')
              const price = showStartingAt ? `Starting at ${lowestPrice}` : lowestPrice

              const period = billingPeriod === 'yearly' && plan.yearlyPrice
                ? '/yr'
                : plan.monthlyPrice === "Let's Talk"
                  ? ''
                  : '/mo'

              return (
                <PricingCard
                  key={plan.name}
                  name={plan.name}
                  price={price}
                  period={period}
                  description={plan.description}
                  features={plan.features}
                  aiAddons={plan.aiAddons}
                  bestFor={plan.bestFor}
                  cta={plan.cta}
                  href={plan.href}
                  popular={plan.popular}
                  highlight={plan.highlight}
                  dark={plan.dark}
                  accent={plan.accent}
                  color={plan.color}
                  yearlySavings={plan.yearlySavings}
                />
              )
            })}
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-8">
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 italic">
            14-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  )
}
