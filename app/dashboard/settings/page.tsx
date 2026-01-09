'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { getBusiness, saveBusiness } from '@/lib/actions/business'
import { getBusinessHours, updateBusinessHours } from '@/lib/actions/schedule'
import { createStripeConnectAccount } from '@/lib/actions/stripe-connect'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AutoAssignmentSettings from '@/components/settings/auto-assignment-settings'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingUrl, setBookingUrl] = useState<string>('')
  const [businessHours, setBusinessHours] = useState<any>(null)
  const [loadingHours, setLoadingHours] = useState(false)
  const [loadingStripe, setLoadingStripe] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBookingUrl(`${window.location.origin}`)
    }
  }, [])

  useEffect(() => {
    async function loadBusinessHours() {
      if (!business) return
      try {
        const hours = await getBusinessHours()
        setBusinessHours(hours)
      } catch (err) {
        console.error('Error loading business hours:', err)
      }
    }
    loadBusinessHours()
  }, [business])

  // Check URL params for Stripe redirect
  useEffect(() => {
    async function handleStripeRedirect() {
      const params = new URLSearchParams(window.location.search)
      const stripeParam = params.get('stripe')

      if (stripeParam === 'success' && business) {
        alert('Stripe account connected successfully!')
        // Update business to mark onboarding complete
        const supabase = createClient()
        await supabase.from('businesses').update({
          stripe_onboarding_completed: true
        }).eq('owner_id', business.owner_id)

        // Reload business data
        const updatedBusiness = await getBusiness()
        if (updatedBusiness) {
          setBusiness(updatedBusiness)
        }

        // Remove param from URL
        window.history.replaceState({}, '', '/dashboard/settings')
      } else if (stripeParam === 'refresh') {
        alert('Stripe setup was interrupted. Please try again.')
        window.history.replaceState({}, '', '/dashboard/settings')
      }
    }

    if (business) {
      handleStripeRedirect()
    }
  }, [business])

  async function loadBusiness() {
    try {
      setLoadingBusiness(true)
      setError(null)

      // Use server action instead of client-side query to avoid 406 errors
      const businessData = await getBusiness()

      if (businessData) {
        setBusiness(businessData)

        // Auto-generate subdomain if missing
        if (!businessData.subdomain || businessData.subdomain.trim() === '') {
          console.log('Business missing subdomain, auto-generating...')
          try {
            // Save with existing data - this will trigger subdomain generation
            const updatedBusiness = await saveBusiness({
              name: businessData.name,
              email: businessData.email,
              phone: businessData.phone,
              address: businessData.address,
              city: businessData.city,
              state: businessData.state,
              zip: businessData.zip,
              website: businessData.website,
              description: businessData.description,
            }, businessData.id)

            if (updatedBusiness) {
              setBusiness(updatedBusiness)
              console.log('Subdomain auto-generated:', updatedBusiness.subdomain)
            }
          } catch (subdomainError) {
            console.error('Error auto-generating subdomain:', subdomainError)
            // Don't show error to user - they can still save manually
          }
        }
      } else {
        // No business found - that's okay, we'll show the create form
        setBusiness(null)
      }
    } catch (err) {
      console.error('Error loading business:', err)
      // Don't show error if it's just "no business found"
      if (err instanceof Error && !err.message.includes('No business found')) {
        setError(`Failed to load business information: ${err.message}`)
      }
      setBusiness(null)
    } finally {
      setLoadingBusiness(false)
    }
  }

  useEffect(() => {
    loadBusiness()
  }, [])

  async function handleBusinessUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      // Check environment variables first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        alert('Supabase environment variables are not configured. Please check your Vercel project settings.')
        setLoading(false)
        return
      }

      const formData = new FormData(e.currentTarget)
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        alert(`Authentication error: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        alert('You must be logged in to save business information.')
        setLoading(false)
        return
      }

      const businessName = formData.get('name') as string
      if (!businessName || businessName.trim() === '') {
        alert('Business name is required.')
        setLoading(false)
        return
      }

      const businessData = {
        name: businessName.trim(),
        email: (formData.get('email') as string)?.trim() || null,
        phone: (formData.get('phone') as string)?.trim() || null,
        address: (formData.get('address') as string)?.trim() || null,
        city: (formData.get('city') as string)?.trim() || null,
        state: (formData.get('state') as string)?.trim() || null,
        zip: (formData.get('zip') as string)?.trim() || null,
        website: (formData.get('website') as string)?.trim() || null,
        description: (formData.get('description') as string)?.trim() || null,
      }

      console.log('Attempting to save business:', {
        hasExistingBusiness: !!business,
        businessName: businessData.name
      })

      // Use server action to save business
      const savedBusiness = await saveBusiness(businessData, business?.id)

      console.log('Business saved successfully:', savedBusiness)
      setBusiness(savedBusiness)

      // Reload to ensure we have the latest
      const reloadedBusiness = await getBusiness()
      if (reloadedBusiness) {
        setBusiness(reloadedBusiness)
      }

      alert(`Business profile ${business ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      console.error('Unexpected error saving business:', error)
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    if (!business) {
      alert('Please complete your business profile first before configuring review settings.')
      setLoading(false)
      return
    }

    const settings = {
      review_automation_enabled:
        formData.get('review_automation_enabled') === 'true',
      review_delay_hours:
        parseInt(formData.get('review_delay_hours') as string) || 24,
      google_review_link: (formData.get('google_review_link') as string) || null,
    }

    const { error } = await supabase
      .from('businesses')
      .update(settings)
      .eq('owner_id', user.id)

    if (error) {
      alert('Failed to update review settings')
      console.error(error)
    } else {
      alert('Review settings updated!')
      setBusiness({ ...business, ...settings })
    }

    setLoading(false)
  }

  async function handleBusinessHours(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingHours(true)

    try {
      const formData = new FormData(e.currentTarget)

      const hours: any = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

      days.forEach(day => {
        const closed = formData.get(`${day}_closed`) === 'true'
        if (closed) {
          hours[day] = { closed: true }
        } else {
          const open = formData.get(`${day}_open`) as string
          const close = formData.get(`${day}_close`) as string
          if (open && close) {
            hours[day] = { open, close, closed: false }
          } else {
            // Default hours if not set
            hours[day] = { open: '09:00', close: '17:00', closed: false }
          }
        }
      })

      await updateBusinessHours(hours)
      setBusinessHours(hours)
      alert('Business hours updated successfully!')
    } catch (error) {
      console.error('Error updating business hours:', error)
      alert('Failed to update business hours')
    } finally {
      setLoadingHours(false)
    }
  }

  async function handleStripeConnect() {
    setLoadingStripe(true)
    try {
      // This will redirect to Stripe, so we won't reach the catch block on success
      // redirect() throws NEXT_REDIRECT internally - this is expected behavior
      await createStripeConnectAccount()
      // If we get here, something went wrong (shouldn't happen due to redirect)
      setLoadingStripe(false)
    } catch (error: any) {
      // Check if this is a NEXT_REDIRECT error (expected behavior)
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
        // This is expected - the redirect is happening
        return
      }

      console.error('Stripe error:', error)
      const errorMessage = error?.message || 'Failed to connect Stripe. Please try again.'
      alert(`Error: ${errorMessage}\n\nIf this persists, check:\n1. STRIPE_SECRET_KEY is set in environment variables\n2. Your internet connection\n3. Try refreshing the page`)
      setLoadingStripe(false)
    }
  }

  if (loadingBusiness) {
    return <div className="p-6">Loading settings...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage your business profile and preferences
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-900 dark:text-red-100">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {!business && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Complete your business setup:</strong> Please fill out your business information below to get started. This is required to use all features of the app.
          </p>
        </div>
      )}

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Settings</TabsTrigger>
          <TabsTrigger value="auto-assignment">Auto-Assignment</TabsTrigger>
          <TabsTrigger value="reviews">Review Automation</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                {business
                  ? 'Update your business details and contact information'
                  : 'Complete your business setup to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {business?.subdomain && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 block">
                    Your Booking Page URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border rounded text-sm text-blue-600 dark:text-blue-400 break-all">
                      {bookingUrl ? `${bookingUrl}/${business.subdomain}` : `/${business.subdomain}`}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = bookingUrl
                          ? `${bookingUrl}/${business.subdomain}`
                          : `/${business.subdomain}`
                        window.open(url, '_blank')
                      }}
                    >
                      Open
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Share this link with customers to let them book appointments
                  </p>
                </div>
              )}

              <form onSubmit={handleBusinessUpdate} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={business?.name || ''}
                      placeholder="Enter your business name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={business?.email || ''}
                        placeholder="business@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={business?.phone || ''}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      defaultValue={business?.website || ''}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={business?.description || ''}
                      placeholder="Tell customers about your business..."
                      rows={4}
                    />
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Address</h3>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={business?.address || ''}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={business?.city || ''}
                        placeholder="Salt Lake City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        defaultValue={business?.state || ''}
                        placeholder="UT"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        name="zip"
                        defaultValue={business?.zip || ''}
                        placeholder="84043"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (business ? 'Saving...' : 'Creating...') : (business ? 'Save Changes' : 'Create Business')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Settings Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your weekly business hours. Customers can only book during these times.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible" style={{ minHeight: 'auto', maxHeight: 'none' }}>
              <form onSubmit={handleBusinessHours} className="space-y-6" style={{ overflow: 'visible', maxHeight: 'none' }}>
                {(() => {
                  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                  console.log('[Settings] Rendering business hours for days:', days)
                  return days.map((day, index) => {
                    const dayKey = day.toLowerCase()
                    const dayHours = businessHours?.[dayKey]
                    const isClosed = dayHours?.closed === true

                    console.log(`[Settings] Rendering ${day} (${dayKey}) at index ${index}:`, { dayHours, isClosed })

                    return (
                      <div 
                        key={`${day}-${index}`}
                        data-day={dayKey}
                        data-day-index={index}
                        className="flex items-center gap-4 rounded-lg border p-4 bg-white dark:bg-zinc-900"
                        style={{ 
                          display: 'flex', 
                          visibility: 'visible',
                          opacity: 1,
                          minHeight: '60px',
                          position: 'relative',
                          zIndex: 1,
                          width: '100%',
                          marginBottom: '1.5rem'
                        }}
                      >
                        <div className="w-24 font-medium text-zinc-900 dark:text-zinc-50 flex-shrink-0">
                          {day}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${dayKey}_closed`}
                            name={`${dayKey}_closed`}
                            value="true"
                            checked={isClosed}
                            onChange={(e) => {
                              // Update local state immediately for better UX
                              const newHours = { ...businessHours }
                              if (e.target.checked) {
                                newHours[dayKey] = { closed: true }
                              } else {
                                newHours[dayKey] = { 
                                  open: dayHours?.open || '09:00', 
                                  close: dayHours?.close || '17:00', 
                                  closed: false 
                                }
                              }
                              setBusinessHours(newHours)
                            }}
                            className="h-4 w-4 rounded"
                          />
                          <Label htmlFor={`${dayKey}_closed`} className="!mt-0 text-sm">
                            Closed
                          </Label>
                        </div>
                        <div className="flex flex-1 items-center gap-2" style={{ display: isClosed ? 'none' : 'flex' }}>
                          <Input
                            type="time"
                            name={`${dayKey}_open`}
                            value={dayHours?.open || '09:00'}
                            onChange={(e) => {
                              const newHours = { ...businessHours }
                              newHours[dayKey] = { 
                                ...newHours[dayKey], 
                                open: e.target.value, 
                                closed: false 
                              }
                              setBusinessHours(newHours)
                            }}
                            className="w-32"
                          />
                          <span className="text-zinc-600 dark:text-zinc-400">to</span>
                          <Input
                            type="time"
                            name={`${dayKey}_close`}
                            value={dayHours?.close || '17:00'}
                            onChange={(e) => {
                              const newHours = { ...businessHours }
                              newHours[dayKey] = { 
                                ...newHours[dayKey], 
                                close: e.target.value, 
                                closed: false 
                              }
                              setBusinessHours(newHours)
                            }}
                            className="w-32"
                          />
                        </div>
                      </div>
                    )
                  })
                })()}

                <div className="flex justify-end">
                  <Button type="submit" disabled={loadingHours}>
                    {loadingHours ? 'Saving...' : 'Save Hours'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Assignment Tab */}
        <TabsContent value="auto-assignment">
          <AutoAssignmentSettings />
        </TabsContent>

        {/* Review Automation Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Review Automation</CardTitle>
              <CardDescription>
                Configure automatic review requests after job completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReviewSettings} className="space-y-6">
                <div className="flex items-center gap-2">
                  <input
                    id="review_automation_enabled"
                    name="review_automation_enabled"
                    type="checkbox"
                    value="true"
                    defaultChecked={business?.review_automation_enabled ?? true}
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="review_automation_enabled" className="!mt-0">
                    Enable automatic review requests after job completion
                  </Label>
                </div>

                <div>
                  <Label htmlFor="review_delay_hours">
                    Send review request after (hours)
                  </Label>
                  <Input
                    id="review_delay_hours"
                    name="review_delay_hours"
                    type="number"
                    min="1"
                    max="168"
                    defaultValue={business?.review_delay_hours || 24}
                  />
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Default: 24 hours after job completion
                  </p>
                </div>

                <div>
                  <Label htmlFor="google_review_link">Google Review Link</Label>
                  <Input
                    id="google_review_link"
                    name="google_review_link"
                    type="url"
                    defaultValue={business?.google_review_link || ''}
                    placeholder="https://g.page/r/..."
                  />
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Your Google Business review link (optional)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Connect your payment processor to accept online payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 1.409 0 2.232.586 2.232 1.574h2.091c-.08-1.694-1.327-3.051-3.443-3.437V2h-2.11v1.626c-2.17.385-3.458 1.859-3.458 3.621 0 2.336 1.945 3.289 4.326 4.134 2.008.649 3.018 1.295 3.018 2.365 0 1.001-.783 1.584-2.129 1.584-1.635 0-2.596-.709-2.596-1.869h-2.11c0 1.869 1.327 3.379 3.706 3.764V20h2.11v-1.774c2.17-.385 3.458-1.904 3.458-3.813 0-2.577-2.024-3.525-4.638-4.263z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Stripe Connect</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      Connect your Stripe account to accept online payments from customers
                    </p>
                    {business?.stripe_account_id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-green-600">
                            {business.stripe_onboarding_completed ? 'Connected & Active' : 'Connected (Setup Incomplete)'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Account ID: {business.stripe_account_id}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleStripeConnect}
                            disabled={loadingStripe}
                            variant="outline"
                            size="sm"
                          >
                            {loadingStripe ? 'Loading...' : 'Manage Stripe Account'}
                          </Button>
                          {!business.stripe_onboarding_completed && (
                            <Button
                              onClick={handleStripeConnect}
                              disabled={loadingStripe}
                              size="sm"
                            >
                              Complete Setup
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleStripeConnect}
                        disabled={loadingStripe}
                      >
                        {loadingStripe ? 'Connecting...' : 'Connect Stripe Account'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>How it works:</strong> When customers book through your BRNNO page and pay, the money goes directly to your Stripe account (minus Stripe's 2.9% + $0.30 fee). We never touch your money.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Email Address</h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {business?.email || 'No email set'}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-semibold">Subscription</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Professional Plan</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        $149/month
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-semibold text-red-600">Danger Zone</h3>
                <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Delete your account and all associated data. This action
                    cannot be undone.
                  </p>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
