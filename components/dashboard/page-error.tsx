import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  message: string
  isNoBusiness?: boolean
  title?: string
}

/**
 * Shared error UI for dashboard server pages when auth/business/data loading fails.
 * Prevents uncaught errors from bubbling to the dashboard error boundary (generic prod message).
 */
export function DashboardPageError({
  message,
  isNoBusiness = false,
  title,
}: Props) {
  const effectiveTitle = title ?? (isNoBusiness ? 'Business Setup Required' : 'Unable to load this page')

  return (
    <div className="p-6">
      <div
        className={`rounded-lg border p-6 ${
          isNoBusiness
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isNoBusiness
              ? 'text-blue-800 dark:text-blue-400'
              : 'text-red-800 dark:text-red-400'
          }`}
        >
          {effectiveTitle}
        </h2>
        <p
          className={`mt-2 text-sm ${
            isNoBusiness
              ? 'text-blue-600 dark:text-blue-300'
              : 'text-red-600 dark:text-red-300'
          }`}
        >
          {message}
        </p>
        {isNoBusiness ? (
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
