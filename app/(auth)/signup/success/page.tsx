'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function SignupSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verifySubscription() {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if business was created
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Poll for business creation (webhook might take a moment)
      let attempts = 0
      const maxAttempts = 10

      const checkBusiness = async () => {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, subscription_status')
          .eq('owner_id', user.id)
          .single()

        if (business && business.subscription_status === 'active') {
          setLoading(false)
          // Redirect to dashboard after a moment
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
          return true
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkBusiness, 1000)
        } else {
          setError('Subscription verification timed out. Please contact support.')
          setLoading(false)
        }

        return false
      }

      checkBusiness()
    }

    verifySubscription()
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Verifying your subscription...
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Please wait while we activate your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Verification Error
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {error}
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 w-16 h-16 mx-auto flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome to BRNNO!
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your subscription is active. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
          <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      }
    >
      <SignupSuccessContent />
    </Suspense>
  )
}

