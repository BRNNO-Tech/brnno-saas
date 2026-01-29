'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error:', error.digest ?? error.message, error)
  }, [error])

  const isClientException =
    typeof error.message === 'string' &&
    (error.message.includes('client-side exception') ||
      error.message.includes('Application error'))

  const displayMessage = isClientException
    ? 'Something went wrong while loading the page. Try again or go to the home page.'
    : error.message || 'Something went wrong.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {displayMessage}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} variant="outline" className="w-full sm:w-auto">
            Try again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="default" className="w-full">
              Go to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
