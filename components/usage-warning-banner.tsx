'use client'

import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import type { UsageSummary } from '@/lib/actions/usage'

export default function UsageWarningBanner({ usage }: { usage: UsageSummary }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const warnings: { message: string; overage: boolean }[] = []

  if (usage.jobs.atLimit) {
    warnings.push({
      message: `You've reached your monthly job limit (${usage.jobs.count}/${usage.jobs.limit}). Upgrade to Pro for unlimited jobs.`,
      overage: true,
    })
  } else if (usage.jobs.atWarning) {
    warnings.push({
      message: `You're nearing your monthly job limit — ${usage.jobs.count} of ${usage.jobs.limit} jobs used.`,
      overage: false,
    })
  }

  if (usage.photos.atLimit) {
    warnings.push({
      message: `You've reached your monthly photo limit (${usage.photos.count}/${usage.photos.limit}). Additional photos are billed at $0.01 each.`,
      overage: true,
    })
  } else if (usage.photos.atWarning) {
    warnings.push({
      message: `You're nearing your monthly photo limit — ${usage.photos.count} of ${usage.photos.limit} photos used.`,
      overage: false,
    })
  }

  if (warnings.length === 0) return null

  const hasOverage = warnings.some(w => w.overage)

  return (
    <div className={`relative px-4 py-3 text-sm flex items-start gap-3 ${
      hasOverage
        ? 'bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        : 'bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
    }`}>
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        {warnings.map((w, i) => (
          <p key={i}>{w.message}{' '}
            <Link
              href="/dashboard/settings/subscription"
              className="underline font-medium hover:no-underline"
            >
              Manage plan
            </Link>
          </p>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
