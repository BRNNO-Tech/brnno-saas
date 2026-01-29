'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getBusiness } from '@/lib/actions/business'
import { AlertCircle } from 'lucide-react'

export function TrialEndedBanner() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const business = await getBusiness()
        if (!mounted || !business) return
        const status = business.subscription_status
        const endsAtRaw = (business as { subscription_ends_at?: string | null }).subscription_ends_at
        const endsAt = endsAtRaw ? new Date(endsAtRaw) : null
        const isActive = status === 'active' || status === 'trialing'
        const isExpired = endsAt && endsAt < new Date()
        if (isActive && !isExpired) return
        if (status === 'trialing' && isExpired) {
          setMessage('Your trial has ended. Upgrade to keep using BRNNO.')
        } else if (status === 'canceled' || status === 'past_due' || status === 'inactive') {
          setMessage('Your subscription has ended. Resubscribe to restore access.')
        } else {
          setMessage('Your trial has ended. Upgrade to keep using BRNNO.')
        }
        setShow(true)
      } catch {
        // Auth or load failed - don't show banner
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('trial-ended-banner-dismissed') : null
      if (stored === 'true') setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem('trial-ended-banner-dismissed', 'true')
    } catch { /* ignore */ }
  }

  if (!show || dismissed) return null

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 border-l-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-amber-900 dark:text-amber-100 flex-1">
            <strong className="font-semibold">Your trial has ended</strong>
            <p className="mt-1 text-sm">
              {message}
              <Link
                href="/dashboard/settings/subscription"
                className="ml-2 inline-flex font-medium underline"
              >
                Upgrade or resubscribe
              </Link>
            </p>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/dashboard/settings/subscription">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Upgrade
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 dark:text-amber-300"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </Alert>
  )
}
