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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadBusiness() {
    try {
      setLoadingBusiness(true)
      setError(null)

      // Check environment variables first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase environment variables are not configured. Please check your Vercel project settings.')
        setLoadingBusiness(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        setError(`Authentication error: ${authError.message}`)
        setLoadingBusiness(false)
        return
      }

      if (!user) {
        setLoadingBusiness(false)
        return
      }

      const { data, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, email, phone, address, city, state, zip, website, description, review_automation_enabled, review_delay_hours, google_review_link, stripe_account_id, created_at, updated_at')
        .eq('owner_id', user.id)
        .single()

      if (businessError) {
        // Business doesn't exist - that's okay, we'll show the create form
        if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object')) {
          // No business found - this is expected for new users
          setBusiness(null)
        } else {
          console.error('Error loading business:', {
            message: businessError.message,
            code: businessError.code,
            details: businessError.details,
            hint: businessError.hint,
          })
          // Don't set error for 406 - it might be a temporary issue
          if (businessError.code !== '406' && businessError.status !== 406) {
            setError(`Error loading business: ${businessError.message}`)
          }
          // Keep existing business state if we have one
          if (!business) {
            setBusiness(null)
          }
        }
      } else if (data) {
        setBusiness(data)
      }
    } catch (err) {
      console.error('Unexpected error loading business:', err)
      setError(`Failed to load business information: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        userId: user.id,
        businessName: businessData.name
      })

      let result
      if (business) {
        // Update existing business
        console.log('Updating existing business with ID:', business.id)
        result = await supabase
          .from('businesses')
          .update(businessData)
          .eq('owner_id', user.id)
          .select()
          .single()
      } else {
        // Create new business
        console.log('Creating new business for user:', user.id)
        const insertData = {
          owner_id: user.id,
          ...businessData,
        }
        console.log('Insert data:', insertData)
        result = await supabase
          .from('businesses')
          .insert(insertData)
          .select()
          .single()
      }

      console.log('Save result:', {
        error: result.error,
        data: result.data,
        hasData: !!result.data
      })

      if (result.error) {
        console.error('Business save error:', result.error)
        const errorDetails = {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint,
        }
        alert(`Failed to ${business ? 'update' : 'create'} business profile:\n\n${result.error.message}\n\nCode: ${result.error.code || 'N/A'}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`)
        setLoading(false)
        return
      }

      if (!result.data) {
        console.error('No data returned from business save')
        // Try to verify if business was actually created
        const { data: verifyBusiness } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (verifyBusiness) {
          console.log('Business exists but was not returned, setting it now')
          setBusiness(verifyBusiness)
          alert('Business profile created successfully!')
          router.refresh()
        } else {
          alert('Business saved but no data was returned. Please refresh the page and check if it was created.')
        }
        setLoading(false)
        return
      }

      // Success - set business immediately
      console.log('Business saved successfully:', result.data)
      setBusiness(result.data)

      // Try to reload, but don't fail if it errors (we already have the data)
      try {
        await loadBusiness()
      } catch (reloadError) {
        console.warn('Failed to reload business, but we have the data:', reloadError)
        // Continue anyway - we already have result.data
      }

      alert(`Business profile ${business ? 'updated' : 'created'} successfully!`)

      // Refresh the router to update any cached data
      router.refresh()
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
              <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 1.409 0 2.232.586 2.232 1.574h2.091c-.08-1.694-1.327-3.051-3.443-3.437V2h-2.11v1.626c-2.17.385-3.458 1.859-3.458 3.621 0 2.336 1.945 3.289 4.326 4.134 2.008.649 3.018 1.295 3.018 2.365 0 1.001-.783 1.584-2.129 1.584-1.635 0-2.596-.709-2.596-1.869h-2.11c0 1.869 1.327 3.379 3.706 3.764V20h2.11v-1.774c2.17-.385 3.458-1.904 3.458-3.813 0-2.577-2.024-3.525-4.638-4.263z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold">
                      Stripe Connect
                    </h3>
                    <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                      Connect your Stripe account to accept online payments from
                      customers
                    </p>
                    {business?.stripe_account_id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            Connected
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Account ID: {business?.stripe_account_id}
                        </p>
                        <Button variant="outline" size="sm" disabled>
                          Manage in Stripe Dashboard
                        </Button>
                      </div>
                    ) : (
                      <Button disabled>Connect Stripe (Coming Soon)</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 <strong>Note:</strong> Stripe Connect integration will be
                  available when the customer booking system is launched. This
                  allows customers to pay you directly through the booking page.
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
