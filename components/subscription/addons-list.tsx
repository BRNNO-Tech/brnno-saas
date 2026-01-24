'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Check, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { SubscriptionAddon } from '@/types/subscription-addons'
import type { BusinessSubscriptionAddon } from '@/types/subscription-addons'
import type { Tier } from '@/lib/permissions'

interface SubscriptionAddonsListProps {
  availableAddons: SubscriptionAddon[]
  activeAddons: BusinessSubscriptionAddon[]
  tier: Tier
}

export default function SubscriptionAddonsList({
  availableAddons,
  activeAddons,
  tier,
}: SubscriptionAddonsListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleAddAddon = async (addon: SubscriptionAddon) => {
    if (!tier) {
      toast.error('You must have an active subscription to add add-ons')
      return
    }

    if (!addon.availableForTiers.includes(tier)) {
      toast.error(`This add-on is not available for your ${tier} plan`)
      return
    }

    setLoading(addon.key)

    try {
      const response = await fetch('/api/create-addon-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addonKey: addon.key,
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No redirect URL returned')
      }
    } catch (error: any) {
      console.error('Error adding add-on:', error)
      toast.error(error.message || 'Failed to add add-on')
      setLoading(null)
    }
  }

  const handleCancelAddon = async (addonKey: string) => {
    if (!confirm('Are you sure you want to cancel this add-on? You will lose access at the end of your billing period.')) {
      return
    }

    setLoading(addonKey)

    try {
      const response = await fetch('/api/cancel-addon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addonKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel add-on')
      }

      toast.success('Add-on canceled successfully')
      router.refresh()
    } catch (error: any) {
      console.error('Error canceling add-on:', error)
      toast.error(error.message || 'Failed to cancel add-on')
    } finally {
      setLoading(null)
    }
  }

  const isAddonActive = (addonKey: string) => {
    return activeAddons.some(addon => addon.addon_key === addonKey && addon.status === 'active')
  }

  const getAddonStatus = (addonKey: string) => {
    const addon = activeAddons.find(a => a.addon_key === addonKey)
    return addon?.status || null
  }

  if (availableAddons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          No subscription add-ons available at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Billing:</span>
        <div className="flex rounded-lg border border-zinc-200 dark:border-white/10 p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Add-ons Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {availableAddons.map((addon) => {
          const isActive = isAddonActive(addon.key)
          const status = getAddonStatus(addon.key)
          const price = billingPeriod === 'monthly' ? addon.monthlyPrice : addon.yearlyPrice
          const isAvailable = tier && addon.availableForTiers.includes(tier)

          return (
            <Card key={addon.key} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {addon.name}
                    </h3>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {status === 'past_due' && (
                      <Badge variant="destructive" className="text-xs">
                        Past Due
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {addon.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                    {billingPeriod === 'yearly' && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Save {Math.round((1 - (addon.yearlyPrice / (addon.monthlyPrice * 12))) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isActive ? (
                  <Button
                    variant="outline"
                    onClick={() => handleCancelAddon(addon.key)}
                    disabled={loading === addon.key}
                    className="flex-1"
                  >
                    {loading === addon.key ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Add-on
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAddAddon(addon)}
                    disabled={loading === addon.key || !isAvailable || !tier}
                    className="flex-1"
                  >
                    {loading === addon.key ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : !tier ? (
                      'No Active Subscription'
                    ) : !isAvailable ? (
                      'Not Available'
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Add-on
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
