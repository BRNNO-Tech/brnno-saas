'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Step1Account from './steps/step-1-account'
import Step2Business from './steps/step-2-business'
import Step3Customize from './steps/step-3-customize'
import Step4Subscription from './steps/step-4-subscription'

export const dynamic = 'force-dynamic'

type FormData = {
  // Step 1
  name: string
  email: string
  password: string
  confirmPassword: string
  // Step 2
  businessName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  // Step 3
  subdomain: string
  description: string
  // Step 4
  selectedPlan: string | null
  billingPeriod: 'monthly' | 'yearly'
  teamSize: number
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupLeadId, setSignupLeadId] = useState<string | null>(null)
  const router = useRouter()
  const hasTrackedEmail = useRef(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    subdomain: '',
    description: '',
    selectedPlan: null,
    billingPeriod: 'monthly',
    teamSize: 0,
  })

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data }

      // Track email when it's first entered (Step 1)
      if (data.email && data.email !== prev.email && !hasTrackedEmail.current) {
        handleEmailCollected(data.email)
        hasTrackedEmail.current = true
      }

      return updated
    })
  }

  // Check if email belongs to a worker
  const checkIfWorker = async (email: string): Promise<boolean> => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return false

    try {
      const supabase = createClient()
      const normalizedEmail = email.toLowerCase().trim()

      console.log('[Signup] Checking if worker with email:', normalizedEmail)

      const { data: workerData, error: workerCheckError } = await supabase
        .rpc('check_team_member_by_email', { check_email: normalizedEmail })

      console.log('[Signup] Worker check result:', { workerData, error: workerCheckError })

      if (workerCheckError) {
        console.error('[Signup] Error checking for worker:', workerCheckError)
        return false
      }

      return workerData && workerData.length > 0
    } catch (error) {
      console.error('[Signup] Error checking for worker:', error)
      return false
    }
  }

  const readJsonOrText = async (response: Response) => {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return response.json()
    }
    const text = await response.text()
    return { error: text || `Request failed with status ${response.status}` }
  }

  // Create signup lead when email is collected
  const handleEmailCollected = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return

    try {
      const response = await fetch('/api/signup/create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await readJsonOrText(response)
        console.error('Failed to create signup lead:', error)
        return
      }

      const { leadId } = await readJsonOrText(response)
      if (leadId) {
        setSignupLeadId(leadId)
      }
    } catch (error) {
      console.error('Failed to create signup lead:', error)
    }
  }

  // Track step progress
  const trackStepProgress = async (step: number, data?: any) => {
    if (!signupLeadId) return

    try {
      await fetch('/api/signup/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: signupLeadId, step, data }),
      })
    } catch (error) {
      console.error('Failed to track step progress:', error)
    }
  }

  // Track abandonment on unmount or navigation away
  useEffect(() => {
    return () => {
      // Mark as abandoned if they didn't complete signup
      if (signupLeadId && currentStep < 4) {
        fetch('/api/signup/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: signupLeadId,
            step: currentStep,
            abandoned: true,
          }),
        }).catch(console.error)
      }
    }
  }, [signupLeadId, currentStep])

  // Track step completion
  useEffect(() => {
    if (signupLeadId && currentStep > 1) {
      const stepData: any = {}

      if (currentStep === 2) {
        stepData.name = formData.name
      } else if (currentStep === 4) {
        stepData.selectedPlan = formData.selectedPlan
        stepData.teamSize = formData.teamSize
        stepData.billingPeriod = formData.billingPeriod
      }

      trackStepProgress(currentStep, stepData)
    }
  }, [currentStep, signupLeadId])

  async function handleStartTrial() {
    setTrialLoading(true)
    setError('')

    const supabase = createClient()

    try {
      console.log('Starting free trial flow...')

      // Create auth account first
      const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            user_type: 'business_owner',
          },
          ...(emailRedirectTo && { emailRedirectTo }),
        },
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        throw signUpError
      }
      if (!data.user) {
        console.error('No user returned from signup')
        throw new Error('Failed to create account')
      }

      console.log('User created:', data.user.id)

      // Clear demo mode cookie when user successfully signs up
      document.cookie = 'demo-mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'

      // Admin bypass (skip payment) - server validates whitelist
      try {
        const adminResponse = await fetch('/api/signup/admin-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: formData.email,
            businessName: formData.businessName,
            planId: formData.selectedPlan,
            billingPeriod: formData.billingPeriod,
            teamSize: formData.teamSize || (formData.selectedPlan === 'starter' ? 1 : (formData.selectedPlan === 'pro' ? 2 : 3)),
            signupLeadId,
            signupData: {
              name: formData.name,
              email: formData.email,
              businessName: formData.businessName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
              subdomain: formData.subdomain,
              description: formData.description,
            },
          }),
        })

        if (adminResponse.ok) {
          const { redirect } = await readJsonOrText(adminResponse)
          window.location.href = redirect || '/dashboard'
          return
        }
      } catch (adminError) {
        console.error('Admin bypass failed:', adminError)
      }

      // Sign in the user immediately so session is established for API call
      console.log('Attempting to sign in user...')
      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        // If sign in fails (e.g., email confirmation required), we'll still try the API
        // but the API should handle this case
        console.warn('Sign in failed, continuing with trial creation:', signInError)
      } else {
        console.log('User signed in successfully')
      }

      // Track subscription selection
      if (signupLeadId) {
        trackStepProgress(5, {
          selectedPlan: formData.selectedPlan,
          teamSize: formData.teamSize,
          billingPeriod: formData.billingPeriod,
          trial: true,
        })
      }

      // Start free trial
      const trialPayload = {
        planId: formData.selectedPlan,
        billingPeriod: formData.billingPeriod,
        teamSize: formData.teamSize || (formData.selectedPlan === 'starter' ? 1 : (formData.selectedPlan === 'pro' ? 2 : 3)),
        email: formData.email,
        businessName: formData.businessName,
        userId: data.user.id,
        signupLeadId: signupLeadId,
        signupData: {
          name: formData.name,
          email: formData.email,
          businessName: formData.businessName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          subdomain: formData.subdomain,
          description: formData.description,
        },
      }

      console.log('Calling /api/start-trial with payload:', { ...trialPayload, signupData: '...' })

      const response = await fetch('/api/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialPayload),
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        let errorData = { error: 'Unknown error' }

        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        } else {
          const text = await response.text().catch(() => 'Unknown error')
          errorData = { error: text }
        }

        console.error('Trial API error:', errorData)
        throw new Error(errorData.error || 'Failed to start free trial')
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Unexpected response format:', text)
        throw new Error('Invalid response from server')
      }

      const result = await response.json().catch((err) => {
        console.error('Failed to parse JSON response:', err)
        throw new Error('Invalid response from server')
      })
      console.log('Trial started successfully:', result)

      // If we didn't sign in earlier (e.g., email confirmation required), try again
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          // If still can't sign in, might need email confirmation
          // Redirect to a page that explains this
          throw new Error(`Account created but sign in failed. Please check your email for confirmation or try logging in.`)
        }
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Failed to start free trial')
      setTrialLoading(false)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      // Check if email belongs to an existing team member (worker)
      // Normalize email to lowercase for comparison
      const normalizedEmail = formData.email.toLowerCase().trim()

      console.log('[Signup] Checking for worker with email:', normalizedEmail)

      const { data: workerData, error: workerCheckError } = await supabase
        .rpc('check_team_member_by_email', { check_email: normalizedEmail })

      console.log('[Signup] Worker check result:', { workerData, error: workerCheckError })

      const existingWorker = workerData && workerData.length > 0 ? workerData[0] : null

      if (workerCheckError) {
        console.error('[Signup] Error checking for worker:', workerCheckError)
        // Don't throw - continue with business owner signup if check fails
        // This allows signup to proceed even if the function has issues
      }

      if (existingWorker) {
        // They're a WORKER - create auth account and link it
        const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              user_type: 'worker',
            },
            ...(emailRedirectTo && { emailRedirectTo }),
          },
        })

        // If user already exists, try to sign them in instead
        if (signUpError && signUpError.message.includes('already registered')) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            })

          if (signInError) {
            throw new Error(
              'This email is already registered. Please use the login page or reset your password.'
            )
          }

          // Link if not already linked
          if (signInData.user && !existingWorker.user_id) {
            await supabase
              .from('team_members')
              .update({ user_id: signInData.user.id })
              .eq('id', existingWorker.id)
          }

          window.location.href = '/worker'
          return
        }

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error('Failed to create account')

        // Link the auth user to the team member record
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ user_id: authData.user.id })
          .eq('id', existingWorker.id)

        if (updateError) {
          throw new Error(`Failed to link your account: ${updateError.message}`)
        }

        // Sign them in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          throw new Error(`Failed to sign in: ${signInError.message}`)
        }

        // Clear demo mode cookie when user successfully signs in
        document.cookie = 'demo-mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'

        // Wait a moment for the database update to propagate
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Redirect to worker dashboard
        window.location.href = '/worker'
        return
      }

      // NOT a worker - create BUSINESS OWNER account
      const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            user_type: 'business_owner',
          },
          ...(emailRedirectTo && { emailRedirectTo }),
        },
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Failed to create account')

      // Clear demo mode cookie when user successfully signs up
      document.cookie = 'demo-mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'

      // Track subscription selection
      if (signupLeadId) {
        trackStepProgress(5, {
          selectedPlan: formData.selectedPlan,
          teamSize: formData.teamSize,
          billingPeriod: formData.billingPeriod,
        })
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: formData.selectedPlan,
          billingPeriod: formData.billingPeriod,
          teamSize: formData.teamSize || (formData.selectedPlan === 'starter' ? 1 : (formData.selectedPlan === 'pro' ? 2 : 3)),
          email: formData.email,
          businessName: formData.businessName,
          userId: data.user.id,
          signupLeadId: signupLeadId, // Pass lead ID to mark as converted later
          signupData: {
            name: formData.name,
            email: formData.email,
            businessName: formData.businessName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            subdomain: formData.subdomain,
            description: formData.description,
          },
        }),
      })

      if (!response.ok) {
        const error = await readJsonOrText(response)
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await readJsonOrText(response)

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8">
      <div className={`w-full space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 ${currentStep === 4 ? 'max-w-6xl' : 'max-w-md'
        }`}>
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors ${step <= currentStep
                  ? 'bg-zinc-900 dark:bg-zinc-50'
                  : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
            />
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {currentStep === 1 && (
          <Step1Account
            formData={{
              name: formData.name,
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            }}
            onUpdate={updateFormData}
            onNext={async () => {
              // Check if this is a worker before proceeding
              const isWorker = await checkIfWorker(formData.email)

              if (isWorker) {
                // They're a worker - create account immediately and redirect
                setLoading(true)
                setError('')

                try {
                  const supabase = createClient()
                  const normalizedEmail = formData.email.toLowerCase().trim()

                  // Get worker data
                  const { data: workerData } = await supabase
                    .rpc('check_team_member_by_email', { check_email: normalizedEmail })

                  const existingWorker = workerData && workerData.length > 0 ? workerData[0] : null

                  if (!existingWorker) {
                    throw new Error('Worker record not found')
                  }

                  // Create auth account
                  const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
                  const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                      data: {
                        full_name: formData.name,
                        user_type: 'worker',
                      },
                      ...(emailRedirectTo && { emailRedirectTo }),
                    },
                  })

                  // If user already exists, try to sign them in instead
                  if (signUpError && signUpError.message.includes('already registered')) {
                    const { data: signInData, error: signInError } =
                      await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password,
                      })

                    if (signInError) {
                      throw new Error(
                        'This email is already registered. Please use the login page or reset your password.'
                      )
                    }

                    // Link if not already linked
                    if (signInData.user && !existingWorker.user_id) {
                      await supabase
                        .from('team_members')
                        .update({ user_id: signInData.user.id })
                        .eq('id', existingWorker.id)
                    }

                    window.location.href = '/worker'
                    return
                  }

                  if (signUpError) throw signUpError
                  if (!authData.user) throw new Error('Failed to create account')

                  // Link the auth user to the team member record
                  const { error: updateError } = await supabase
                    .from('team_members')
                    .update({ user_id: authData.user.id })
                    .eq('id', existingWorker.id)

                  if (updateError) {
                    throw new Error(`Failed to link your account: ${updateError.message}`)
                  }

                  // Sign them in
                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                  })

                  if (signInError) {
                    throw new Error(`Failed to sign in: ${signInError.message}`)
                  }

                  // Clear demo mode cookie
                  document.cookie = 'demo-mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'

                  // Wait a moment for the database update to propagate
                  await new Promise((resolve) => setTimeout(resolve, 500))

                  // Redirect to worker dashboard
                  window.location.href = '/worker'
                  return
                } catch (err: any) {
                  setError(err.message || 'Failed to create worker account')
                  setLoading(false)
                  return
                }
              }

              // Not a worker - continue with business signup flow
              trackStepProgress(2, { name: formData.name })
              setCurrentStep(2)
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Business
            formData={{
              businessName: formData.businessName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
            }}
            onUpdate={updateFormData}
            onNext={() => {
              trackStepProgress(3)
              setCurrentStep(3)
            }}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Customize
            formData={{
              subdomain: formData.subdomain,
              description: formData.description,
            }}
            businessName={formData.businessName}
            onUpdate={updateFormData}
            onSubmit={() => {
              trackStepProgress(4)
              setCurrentStep(4)
            }}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        )}

        {currentStep === 4 && (
          <Step4Subscription
            selectedPlan={formData.selectedPlan}
            billingPeriod={formData.billingPeriod}
            teamSize={formData.teamSize}
            onPlanSelect={(plan) => updateFormData({ selectedPlan: plan })}
            onBillingChange={(period) => updateFormData({ billingPeriod: period })}
            onTeamSizeChange={(size) => updateFormData({ teamSize: size })}
            onSubmit={handleSubmit}
            onStartTrial={handleStartTrial}
            onBack={() => setCurrentStep(3)}
            loading={loading}
            trialLoading={trialLoading}
          />
        )}

        <div className="text-center text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
          </span>
          <a
            href="/login"
            className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
