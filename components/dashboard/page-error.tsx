import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  message?: string
  isNoBusiness?: boolean
  isTrialEnded?: boolean
  title?: string
}

/**
 * Shared error UI for dashboard server pages when auth/business/data loading fails.
 * Prevents uncaught errors from bubbling to the dashboard error boundary (generic prod message).
 * When isTrialEnded: show one consistent "Your trial has ended" + Upgrade (no Go to Login).
 */
export function DashboardPageError({
  message,
  isNoBusiness = false,
  isTrialEnded = false,
  title,
}: Props) {
  const effectiveTitle =
    title ??
    (isTrialEnded
      ? 'Your trial has ended'
      : isNoBusiness
        ? 'Business Setup Required'
        : 'Unable to load this page')
  const effectiveMessage =
    message ??
    (isTrialEnded
      ? 'Upgrade or resubscribe to restore full access to BRNNO.'
      : 'An error occurred.')

  const isTrialStyle = isTrialEnded
  const isBlueStyle = isNoBusiness && !isTrialEnded
  const isRedStyle = !isNoBusiness && !isTrialEnded

  return (
    <div className="p-6">
      <div
        className={`rounded-lg border p-6 ${
          isTrialStyle
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : isBlueStyle
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isTrialStyle
              ? 'text-amber-800 dark:text-amber-400'
              : isBlueStyle
                ? 'text-blue-800 dark:text-blue-400'
                : 'text-red-800 dark:text-red-400'
          }`}
        >
          {effectiveTitle}
        </h2>
        <p
          className={`mt-2 text-sm ${
            isTrialStyle
              ? 'text-amber-700 dark:text-amber-300'
              : isBlueStyle
                ? 'text-blue-600 dark:text-blue-300'
                : 'text-red-600 dark:text-red-300'
          }`}
        >
          {effectiveMessage}
        </p>
        {isTrialEnded ? (
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard/settings/subscription">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Upgrade
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        ) : isNoBusiness ? (
          <div className="mt-4">
            <Link href="/dashboard/settings">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Go to Settings
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex gap-3">
            <Link href="/login">
              <Button variant="default">Go to Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
