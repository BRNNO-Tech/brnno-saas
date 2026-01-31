'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const isEmailNotConfirmed = (message: string) =>
  /not confirmed|email not confirmed/i.test(message)

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState<{ email: string } | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) setSuccessMessage(decodeURIComponent(message))
  }, [searchParams])

  // If user landed here with a password-reset hash (e.g. Site URL is /login), send them to update-password
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      window.location.replace(`/login/update-password${hash}`)
    }
  }, [])

  async function handleResendConfirmation() {
    if (!emailNotConfirmed?.email) return
    setResendLoading(true)
    setResendSuccess(false)
    setError('')
    try {
      const supabase = createClient()
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailNotConfirmed.email,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })
      if (resendError) {
        setError(resendError.message)
      } else {
        setResendSuccess(true)
        setError('')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resend confirmation email.')
    } finally {
      setResendLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailNotConfirmed(null)
    setResendSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()

      // Validate client was created properly
      if (!supabase) {
        setError('Failed to initialize authentication. Please check your configuration.')
        setLoading(false)
        return
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (isEmailNotConfirmed(signInError.message)) {
          setEmailNotConfirmed({ email })
          setError(
            'Your email isn’t confirmed yet. Check your inbox for the confirmation link, or resend it below. ' +
            'For dev: you can disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.'
          )
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Failed to get user information')
        setLoading(false)
        return
      }

      // Check if user is a team member (worker) by user_id
      const { data: worker } = await supabase
        .from('team_members')
        .select('id, role, business_id')
        .eq('user_id', user.id)
        .maybeSingle()

      // Clear demo mode cookie when user successfully logs in
      // Set cookie to expire in the past to delete it
      document.cookie = 'demo-mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
      
      // Success - redirect based on role
      if (worker) {
        router.push('/worker')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('fetch')) {
        setError('Network error: Unable to connect to authentication server. Please check:\n1. Your internet connection\n2. Supabase environment variables are set correctly\n3. Your Supabase project is active')
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400 whitespace-pre-line">{error}</p>
          </div>
        )}

        {emailNotConfirmed && (
          <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20 space-y-2">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              We can send a new confirmation link to <strong>{emailNotConfirmed.email}</strong>.
            </p>
            {resendSuccess ? (
              <p className="text-sm text-green-700 dark:text-green-300">Check your inbox and spam folder, then try signing in again.</p>
            ) : (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="text-sm font-medium text-amber-700 dark:text-amber-200 underline hover:no-underline disabled:opacity-50"
              >
                {resendLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3.98 8.223m0 0A10.477 10.477 0 001.934 12m1.046-3.777m0 0L12 12m-8.976-3.777L12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="/login/forgot-password"
                className="font-medium text-zinc-600 hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
            </span>
            <a
              href="/signup"
              className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

