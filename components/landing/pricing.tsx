'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PricingCard from './pricing-card'

const plans = [
  {
    name: 'Starter',
    color: 'green' as const,
    description: 'For solo operators getting organized.',
    monthlyPrice: '$69–$89',
    yearlyPrice: '$690–$890',
    yearlySavings: 'Save 2 months',
    features: [
      'Instant Booking (customer portal)',
      'Upfront Payments (deposits or full amount)',
      'Basic Jobs View (today\'s schedule)',
      'Lead Recovery: Limited',
      'No Hot/Warm/Cold dashboard',
      'No automation',
    ],
    aiAddons: [
      'AI SMS Assistant (+$19–$49/mo)',
      'AI Chatbot (+$29–$79/mo)',
    ],
    cta: 'Get Starter',
    href: '/signup',
  },
  {
    name: 'Pro',
    color: 'blue' as const,
    description: 'Automation + revenue tools.',
    monthlyPrice: '$149–$199',
    yearlyPrice: '$1,490–$1,990',
    yearlySavings: 'Save 2 months + extra AI/SMS credits',
    popular: true,
    highlight: true,
    features: [
      'Everything in Starter, plus:',
      'Full Automation (reviews, follow-ups, rebook reminders)',
      'Advanced Quotes & Invoices',
      'Reports (monthly revenue + top services)',
      'Custom Service Menus',
      'Team Management (1–3 techs)',
      'Lead Recovery Dashboard (Hot/Warm/Cold tracking)',
    ],
    aiAddons: [
      'AI Lead Recovery Agent (+$19–$49/mo)',
      'AI Chatbot (+$29–$79/mo)',
      'AI SMS Assistant (+$19–$49/mo)',
      'AI Photo Analyzer (+$9–$29/mo)',
      'AI Quote Builder (+$19/mo)',
    ],
    cta: 'Upgrade to Pro',
    href: '/signup',
  },
  {
    name: 'Fleet',
    color: 'purple' as const,
    description: 'For multi-vehicle teams needing coordination + oversight.',
    monthlyPrice: '$299–$399',
    yearlyPrice: '$2,990–$3,990',
    yearlySavings: 'Save 2 months + VIP support',
    features: [
      'Everything in Pro, plus:',
      'Team Management (1–5 techs)',
      'Earnings Tracking (team vs individual performance)',
      'Priority Support (direct line)',
    ],
    aiAddons: [
      'AI Voice Agent (+$49–$149/mo)',
      'All other AI add-ons at discounted rates',
      'Optional AI Power Pack bundle',
    ],
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
      'White-label options',
      'Multi-location support',
      'Enterprise SSO',
      'SLA guarantees',
      'On-site training',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    dark: true,
  },
  {
    name: 'AI Add-ons Suite',
    color: 'gray' as const,
    description: 'Optional upgrades that automate your business and boost revenue.',
    monthlyPrice: 'From $9/mo',
    yearlyPrice: null,
    features: [
      'AI Chatbot Assistant ($29–$79/mo)',
      'AI Lead Recovery Agent ($19–$49/mo)',
      'AI SMS Assistant ($19–$49/mo + usage)',
      'AI Photo Analyzer ($9–$29/mo)',
      'AI Quote Builder ($19/mo)',
      'AI Voice Agent ($49–$149/mo)',
    ],
    cta: 'View AI Suite',
    href: '/ai-add-ons',
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
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Save 2 months
              </span>
            )}
          </div>
          
          {billingPeriod === 'yearly' && (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 px-4">
              * Yearly plans are billed annually
            </p>
          )}
          
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
              const price = billingPeriod === 'monthly' 
                ? plan.monthlyPrice 
                : (plan.yearlyPrice || plan.monthlyPrice)
              const period = billingPeriod === 'yearly' && plan.yearlyPrice 
                ? '/yr' 
                : plan.monthlyPrice === "Let's Talk" || plan.monthlyPrice === 'From $9/mo'
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
