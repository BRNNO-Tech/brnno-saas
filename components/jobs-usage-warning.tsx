'use client'

import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'
import type { UsageSummary } from '@/lib/actions/usage'

export default function JobsUsageWarning({ usage }: { usage: UsageSummary }) {
  const { jobs } = usage

  if (jobs.isUnlimited || (!jobs.atWarning && !jobs.atLimit)) return null

  const isAtLimit = jobs.atLimit

  return (
    <div className={`rounded-lg px-4 py-3 flex items-start gap-3 text-sm ${
      isAtLimit
        ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
    }`}>
      {isAtLimit ? (
        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        {isAtLimit ? (
          <p>
            You've reached your monthly job limit of {jobs.limit} on the Free plan.
            New jobs cannot be created until next month or you{' '}
            <Link href="/dashboard/settings/subscription" className="underline font-medium">
              upgrade to Pro
            </Link>
            .
          </p>
        ) : (
          <p>
            You're nearing your monthly job limit — {jobs.count} of {jobs.limit} jobs used.{' '}
            <Link href="/dashboard/settings/subscription" className="underline font-medium">
              Upgrade to Pro
            </Link>
            {' '}for unlimited jobs.
          </p>
        )}
      </div>
    </div>
  )
}
