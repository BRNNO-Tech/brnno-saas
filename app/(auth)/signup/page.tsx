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
        const error = await response.json()
        console.error('Failed to create signup lead:', error)
        return
      }

      const { leadId } = await response.json()
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

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      // Check if email belongs to an existing team member (worker)
      const { data: workerData, error: workerCheckError } = await supabase
        .rpc('check_team_member_by_email', { check_email: formData.email })

      const existingWorker = workerData && workerData.length > 0 ? workerData[0] : null

      if (workerCheckError) {
        throw workerCheckError
      }

      if (existingWorker) {
        // They're a WORKER - create auth account and link it
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              user_type: 'worker',
            },
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            user_type: 'business_owner',
          },
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
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
      <div className={`w-full space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900 ${
        currentStep === 4 ? 'max-w-6xl' : 'max-w-md'
      }`}>
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors ${
                step <= currentStep
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
            onNext={() => {
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
            onBack={() => setCurrentStep(3)}
            loading={loading}
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
