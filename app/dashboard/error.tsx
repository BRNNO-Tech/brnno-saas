'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service (digest is stable for correlation in prod)
    console.error('Dashboard error:', error.digest ?? error.message, error)
  }, [error])

  const isProductionGeneric =
    typeof error.message === 'string' &&
    error.message.includes('Server Components render')

  const displayMessage = isProductionGeneric
    ? 'Your session may have expired or something went wrong on our side. Try again or sign in again.'
    : (error.message || 'An unexpected error occurred while loading the dashboard.')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
        <h2 className="text-2xl font-semibold text-red-800 dark:text-red-400">
          Something went wrong!
        </h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">
          {displayMessage}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Link href="/login">
            <Button variant="default">Go to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

