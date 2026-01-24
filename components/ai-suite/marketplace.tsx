'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle2, Loader2, TrendingUp, Image, Star, Bot, Zap, Settings, Navigation } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SubscriptionAddon } from '@/types/subscription-addons'

interface AIAddon {
  id: string
  name: string
  description: string
  price: number
  status: 'available' | 'coming_soon' | 'beta'
  stripePriceId: string
  icon: any
  benefits: string[]
  popular?: boolean
}

const AI_ADDONS: AIAddon[] = [
  {
    id: 'ai_photo_analysis',
    name: 'AI Photo Analysis',
    description: 'Customer photo uploads → AI detects condition automatically',
    price: 49,
    status: 'available',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PHOTO_ANALYSIS_PRICE_ID || '',
    icon: Image,
    popular: true,
    benefits: [
      'Auto-detect vehicle condition from photos',
      'Smart add-on suggestions based on damage',
      '40% higher booking conversion rates',
      'Reduce quote disputes and surprises'
    ]
  },
  {
    id: 'ai_lead_scoring',
    name: 'AI Lead Scoring',
    description: 'Automatically prioritize your hottest leads',
    price: 29,
    status: 'coming_soon',
    stripePriceId: '',
    icon: TrendingUp,
    benefits: [
      'Hot/warm/cold lead indicators',
      'Response time tracking',
      'Conversion probability predictions',
      'Focus on best opportunities first'
    ]
  },
  {
    id: 'ai_quote_optimizer',
    name: 'AI Quote Optimizer',
    description: 'Dynamic pricing based on demand, season, and history',
    price: 39,
    status: 'coming_soon',
    stripePriceId: '',
    icon: Zap,
    benefits: [
      'Real-time price optimization',
      'Seasonal demand adjustments',
      'Competitor pricing insights',
      'Maximize revenue per booking'
    ]
  },
  {
    id: 'ai_review_generator',
    name: 'AI Review Generator',
    description: 'Auto-generate review requests with personalized messaging',
    price: 19,
    status: 'beta',
    stripePriceId: '',
    icon: Star,
    benefits: [
      'Personalized review request messages',
      'Optimal timing for requests',
      'Follow-up automation',
      'Boost your online reputation'
    ]
  },
  {
    id: 'ai_assistant',
    name: 'AI Business Assistant',
    description: 'Chat with your business data and get insights',
    price: 59,
    status: 'coming_soon',
    stripePriceId: '',
    icon: Bot,
    benefits: [
      'Ask questions about your business',
      'Get revenue and booking insights',
      'Customer trend analysis',
      '24/7 intelligent support'
    ]
  }
]

interface AISuiteMarketplaceProps {
  business: any
  subscriptions: any[]
  availableAddons?: SubscriptionAddon[]
  highlightAddon?: string
  showSuccess?: boolean
}

export function AISuiteMarketplace({ 
  business, 
  subscriptions,
  availableAddons = [],
  highlightAddon,
  showSuccess 
}: AISuiteMarketplaceProps) {
  const router = useRouter()
  const [purchasingAddon, setPurchasingAddon] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(showSuccess)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  // Scroll to highlighted addon
  useEffect(() => {
    if (highlightAddon) {
      setTimeout(() => {
        const element = document.getElementById(highlightAddon)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [highlightAddon])

  const isAddonEnabled = (addonId: string) => {
    // Check if addon is in business features array (if it exists)
    if (business.features?.includes(addonId)) {
      return true
    }
    // Check if addon is in active subscriptions
    // Map addonId to addon_key format (they should match for subscription addons)
    const addonKey = addonId // addonId should match addon_key for subscription addons
    return subscriptions.some(sub => 
      sub.addon_key === addonKey && (sub.status === 'active' || sub.status === 'trial')
    )
  }

  const handlePurchaseAddon = async (addon: AIAddon) => {
    if (addon.status !== 'available') return
    
    setPurchasingAddon(addon.id)
    
    // Get the correct price ID based on billing period
    // For subscription addons, we need to get it from availableAddons
    let priceId = addon.stripePriceId
    if (!priceId && availableAddons.length > 0) {
      const subscriptionAddon = availableAddons.find(a => a.key === addon.id)
      if (subscriptionAddon) {
        priceId = billingPeriod === 'monthly' 
          ? (subscriptionAddon.stripeMonthlyPriceId || '')
          : (subscriptionAddon.stripeYearlyPriceId || '')
      }
    }
    
    if (!priceId) {
      alert('Price not configured for this add-on. Please contact support.')
      setPurchasingAddon(null)
      return
    }
    
    try {
      const response = await fetch('/api/stripe/create-addon-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addonId: addon.id,
          priceId: priceId,
          businessId: business.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error purchasing addon:', error)
      alert('Failed to start checkout. Please try again.')
      setPurchasingAddon(null)
    }
  }

  const handleManageAddon = (addonId: string) => {
    router.push(`/dashboard/ai-suite/${addonId}/settings`)
  }

  const getAddonIcon = (addonId: string) => {
    if (addonId === 'ai_photo_analysis') return Image
    if (addonId === 'mileage_tracker') return Navigation
    if (addonId === 'ai_lead_scoring') return TrendingUp
    if (addonId === 'ai_quote_optimizer') return Zap
    if (addonId === 'ai_review_generator') return Star
    if (addonId === 'ai_assistant') return Bot
    return Sparkles
  }

  // Merge hardcoded AI addons with subscription addons from definitions
  // Convert subscription addons to AIAddon format
  const subscriptionAddonsAsAIAddons: AIAddon[] = availableAddons.map(addon => {
    const price = billingPeriod === 'monthly' ? addon.monthlyPrice : addon.yearlyPrice
    const stripePriceId = billingPeriod === 'monthly' 
      ? (addon.stripeMonthlyPriceId || '') 
      : (addon.stripeYearlyPriceId || '')
    
    return {
      id: addon.key,
      name: addon.name,
      description: addon.description,
      price,
      status: 'available' as const,
      stripePriceId,
      icon: getAddonIcon(addon.key),
      benefits: [
        // Generate benefits from description or use defaults
        ...(addon.key === 'mileage_tracker' ? [
          'Automatic mileage tracking',
          'Google Maps integration',
          'IRS deduction calculations',
          'CSV export for tax filing'
        ] : []),
        ...(addon.key === 'ai_photo_analysis' ? [
          'Auto-detect vehicle condition from photos',
          'Smart add-on suggestions based on damage',
          '40% higher booking conversion rates',
          'Reduce quote disputes and surprises'
        ] : [])
      ],
      popular: addon.key === 'ai_photo_analysis'
    }
  })

  // Combine hardcoded AI addons (for coming soon features) with subscription addons
  // Remove duplicates (prefer subscription addon if exists)
  const allAddons: AIAddon[] = [
    ...subscriptionAddonsAsAIAddons,
    ...AI_ADDONS.filter(aiAddon => 
      !subscriptionAddonsAsAIAddons.some(subAddon => subAddon.id === aiAddon.id)
    )
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Add-ons</h1>
        </div>
        <p className="text-muted-foreground">
          Enhance your business with powerful add-ons. Add them individually as you need them.
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-400">
              Successfully subscribed! Your AI feature is now active.
            </p>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Billing:</span>
        <Button
          variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingPeriod('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingPeriod('yearly')}
        >
          Yearly
        </Button>
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAddons.map((addon) => {
          const Icon = addon.icon
          const enabled = isAddonEnabled(addon.id)
          const isHighlighted = highlightAddon === addon.id
          const isPurchasing = purchasingAddon === addon.id

          return (
            <Card
              key={addon.id}
              id={addon.id}
              className={`relative ${
                isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
              } ${enabled ? 'border-green-200 dark:border-green-800' : ''}`}
            >
              {addon.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{addon.name}</CardTitle>
                      {addon.status !== 'available' && (
                        <Badge variant="outline" className="mt-1">
                          {addon.status === 'coming_soon' ? 'Coming Soon' : 'Beta'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {enabled && (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <CardDescription className="mt-2">
                  {addon.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {addon.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2 w-full">
                  <span className="text-3xl font-bold">${addon.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingPeriod === 'yearly' && addon.status === 'available' && (
                  <p className="text-xs text-muted-foreground">
                    Save ${((addon.price * 12) - (addon.price * 12 * 0.1)).toFixed(2)} per year
                  </p>
                )}
                
                {enabled ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleManageAddon(addon.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Settings
                  </Button>
                ) : addon.status === 'available' ? (
                  <Button 
                    className="w-full"
                    onClick={() => handlePurchaseAddon(addon)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Subscribe for $${addon.price.toFixed(2)}/${billingPeriod === 'monthly' ? 'mo' : 'yr'}`
                    )}
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    {addon.status === 'coming_soon' ? 'Coming Soon' : 'Join Beta Waitlist'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Pro tip:</strong> Each AI add-on works independently. Start with what you need most and add more as you grow.
          Cancel anytime with no penalties.
        </p>
      </div>
    </div>
  )
}
