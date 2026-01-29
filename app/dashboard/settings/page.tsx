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
import PriorityTimeBlocksSettings from '@/components/schedule/priority-time-blocks-settings'
import { createClient } from '@/lib/supabase/client'
import { getBusiness, saveBusiness } from '@/lib/actions/business'
import { signOut } from '@/lib/actions/auth'
import { sendTestEmail, sendTestSMS } from '@/lib/actions/channels'
import { getBusinessHours, updateBusinessHours } from '@/lib/actions/schedule'
import { createStripeConnectAccount } from '@/lib/actions/stripe-connect'
import { updateSMSSettings } from '@/lib/actions/sms-settings'
import { generateAPIKeyForBusiness, addWebhookEndpoint, removeWebhookEndpoint, testWebhookEndpoint } from '@/lib/actions/integrations'
import { updateConditionConfig } from '@/lib/actions/business'
import { getCurrentTier } from '@/lib/actions/permissions'
import { isAdminEmail } from '@/lib/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import ConditionSettings from '@/components/settings/condition-settings'
import DiscountCodesSettings from '@/components/settings/discount-codes-settings'
import ServiceFeatureSettings from '@/components/settings/service-feature-settings'
// import AutoAssignmentSettings from '@/components/settings/auto-assignment-settings' // Hidden - on back burner

// Brand Settings Form Component
function BrandSettingsForm({
  business,
  onBusinessUpdate,
  loading,
  setLoading
}: {
  business: any
  onBusinessUpdate: (business: any) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState(business?.accent_color || '#6366f1')
  const [accentColorText, setAccentColorText] = useState(business?.accent_color || '#6366f1')
  const [senderName, setSenderName] = useState(business?.sender_name || business?.name || '')
  const [defaultTone, setDefaultTone] = useState<'friendly' | 'premium' | 'direct'>(business?.default_tone || 'friendly')

  useEffect(() => {
    if (business) {
      setAccentColor(business.accent_color || '#6366f1')
      setAccentColorText(business.accent_color || '#6366f1')
      setSenderName(business.sender_name || business.name || '')
      setDefaultTone(business.default_tone || 'friendly')
      // Update previews from business data (only if no file is currently selected)
      if (!logoFile && business.logo_url) {
        setLogoPreview(business.logo_url)
      }
      if (!bannerFile && business.booking_banner_url) {
        setBannerPreview(business.booking_banner_url)
      }
    }
  }, [business, logoFile, bannerFile])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorChange = (color: string) => {
    setAccentColor(color)
    setAccentColorText(color)
  }

  const handleColorTextChange = (text: string) => {
    // Normalize the input - add # if missing
    let normalizedText = text.trim()
    if (normalizedText && !normalizedText.startsWith('#')) {
      normalizedText = '#' + normalizedText
    }

    // Validate hex color format - accept 3 or 6 digit hex codes
    // Also allow empty string while typing
    if (normalizedText === '' || normalizedText === '#') {
      setAccentColorText(normalizedText)
      return
    }

    // Check if it's a valid hex color (3 or 6 digits after #)
    const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i
    if (hexPattern.test(normalizedText)) {
      // Convert 3-digit hex to 6-digit if needed
      if (normalizedText.length === 4) {
        const r = normalizedText[1]
        const g = normalizedText[2]
        const b = normalizedText[3]
        normalizedText = `#${r}${r}${g}${g}${b}${b}`
      }
      setAccentColor(normalizedText)
      setAccentColorText(normalizedText)
    } else {
      // Allow typing even if not valid yet (for better UX)
      setAccentColorText(normalizedText)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      let logoUrl = business?.logo_url || null
      let bannerUrl = business?.booking_banner_url || null

      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          const formData = new FormData()
          formData.append('file', logoFile)

          const response = await fetch('/api/upload-logo', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to upload logo')
          }

          const data = await response.json()
          logoUrl = data.url
          toast.success('Logo uploaded successfully')
        } catch (error) {
          console.error('Error uploading logo:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to upload logo. Please try again.')
          setLoading(false)
          return
        }
      }

      // Upload booking banner if a new file was selected
      if (bannerFile) {
        try {
          const formData = new FormData()
          formData.append('file', bannerFile)

          const response = await fetch('/api/upload-booking-banner', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to upload banner')
          }

          const data = await response.json()
          bannerUrl = data.url
          toast.success('Booking banner uploaded successfully')
        } catch (error) {
          console.error('Error uploading booking banner:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to upload booking banner. Please try again.')
          setLoading(false)
          return
        }
      }

      // Validate accent color before saving
      let finalAccentColor = accentColor
      if (accentColorText && accentColorText.trim()) {
        let normalizedColor = accentColorText.trim()
        if (!normalizedColor.startsWith('#')) {
          normalizedColor = '#' + normalizedColor
        }
        // Validate and normalize hex color
        const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i
        if (hexPattern.test(normalizedColor)) {
          // Convert 3-digit hex to 6-digit if needed
          if (normalizedColor.length === 4) {
            const r = normalizedColor[1]
            const g = normalizedColor[2]
            const b = normalizedColor[3]
            normalizedColor = `#${r}${r}${g}${g}${b}${b}`
          }
          finalAccentColor = normalizedColor
        } else {
          toast.error('Invalid color code. Please use a valid hex color (e.g., #FF0000 or #F00)')
          setLoading(false)
          return
        }
      }

      // Update brand settings via API route
      const updateResponse = await fetch('/api/update-brand-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo_url: logoUrl,
          accent_color: finalAccentColor,
          sender_name: senderName || null,
          default_tone: defaultTone,
          booking_banner_url: bannerUrl,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to update brand settings')
      }

      // Reload business data to get updated URLs and preserve all fields
      const updatedBusiness = await getBusiness()
      if (updatedBusiness) {
        // Type assertion to access brand settings properties that may not be in the base type
        const businessWithBrand = updatedBusiness as any
        // Preserve subdomain and all other fields when updating
        onBusinessUpdate({
          ...business, // Preserve existing business data
          ...updatedBusiness, // Override with updated data
          logo_url: logoUrl !== undefined ? logoUrl : businessWithBrand.logo_url,
          booking_banner_url: bannerUrl !== undefined ? bannerUrl : businessWithBrand.booking_banner_url,
        })
        // Update previews with the new URLs
        if (logoUrl) {
          setLogoPreview(logoUrl)
        } else if (businessWithBrand.logo_url) {
          setLogoPreview(businessWithBrand.logo_url)
        }
        if (bannerUrl) {
          setBannerPreview(bannerUrl)
        } else if (businessWithBrand.booking_banner_url) {
          setBannerPreview(businessWithBrand.booking_banner_url)
        }
      }

      toast.success('Brand settings saved successfully!')
      setLogoFile(null)
      setBannerFile(null)
      // Previews are already set above
    } catch (error) {
      console.error('Error saving brand settings:', error)
      toast.error('Failed to save brand settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayLogo = logoPreview || business?.logo_url

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload */}
      <div>
        <Label>Logo</Label>
        <div className="mt-2 flex items-center gap-4">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt="Business logo"
              className="h-20 w-20 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-500">No logo</span>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              className="text-sm"
              onChange={handleLogoChange}
            />
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Recommended: 200x200px. Allowed formats: JPG, PNG, WEBP, SVG (max 10MB)
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Booking Banner Upload */}
      <div>
        <Label>Booking Page Banner</Label>
        <p className="mt-1 mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add a custom header image to your booking pages (optional)
        </p>
        <div className="mt-2">
          {bannerPreview ? (
            <div className="mb-4">
              <img
                src={bannerPreview}
                alt="Booking banner preview"
                className="w-full h-48 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
            </div>
          ) : (
            <div className="mb-4 h-48 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
              <span className="text-sm text-zinc-500">No banner image</span>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="text-sm"
              onChange={handleBannerChange}
            />
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Recommended: 1200x300px or wider. Allowed formats: JPG, PNG, WEBP, GIF (max 20MB). This appears at the top of your booking pages.
            </p>
            {bannerPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/update-brand-settings', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        booking_banner_url: null,
                      }),
                    })

                    if (!response.ok) {
                      const errorData = await response.json()
                      throw new Error(errorData.error || 'Failed to remove banner')
                    }

                    setBannerPreview(null)
                    setBannerFile(null)
                    const updatedBusiness = await getBusiness()
                    if (updatedBusiness) {
                      onBusinessUpdate(updatedBusiness)
                    }
                    toast.success('Banner removed successfully')
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to remove banner')
                  }
                }}
              >
                Remove Banner
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Accent Color */}
      <div>
        <Label htmlFor="accent_color">Accent Color</Label>
        <div className="mt-2 flex items-center gap-3">
          <Input
            id="accent_color"
            name="accent_color"
            type="color"
            value={accentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-10 w-20 cursor-pointer"
          />
          <Input
            type="text"
            value={accentColorText}
            onChange={(e) => handleColorTextChange(e.target.value)}
            placeholder="#6366f1"
            className="flex-1 font-mono text-sm"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Used for buttons, links, and highlights throughout the app
        </p>
      </div>

      <Separator />

      {/* Outbound Sender Name */}
      <div>
        <Label htmlFor="sender_name">Outbound Sender Name</Label>
        <Input
          id="sender_name"
          name="sender_name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your Business Name"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Name that appears when sending SMS/Email to leads
        </p>
      </div>

      <Separator />

      {/* Tone Defaults */}
      <div>
        <Label>Tone Defaults</Label>
        <p className="mt-1 mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Default tone for automated messages and sequences
        </p>
        <div className="space-y-2">
          {(['friendly', 'premium', 'direct'] as const).map((tone) => (
            <div key={tone} className="flex items-center gap-2">
              <input
                type="radio"
                id={`tone_${tone}`}
                name="default_tone"
                value={tone}
                checked={defaultTone === tone}
                onChange={(e) => setDefaultTone(e.target.value as 'friendly' | 'premium' | 'direct')}
                className="h-4 w-4"
              />
              <Label htmlFor={`tone_${tone}`} className="!mt-0 capitalize">
                {tone}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Brand Settings'}
        </Button>
      </div>
    </form>
  )
}

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
  const [savingBrand, setSavingBrand] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingSMS, setTestingSMS] = useState(false)
  const [savingSMS, setSavingSMS] = useState(false)
  const [generatingAPIKey, setGeneratingAPIKey] = useState(false)
  const [addingWebhook, setAddingWebhook] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [smsProvider, setSmsProvider] = useState<'surge' | 'twilio' | null>(null)
  const [surgeApiKey, setSurgeApiKey] = useState('')
  const [surgeAccountId, setSurgeAccountId] = useState('')
  const [twilioAccountSid, setTwilioAccountSid] = useState('')
  const [twilioAuthToken, setTwilioAuthToken] = useState('')
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBookingUrl(`${window.location.origin}`)
    }
  }, [])

  useEffect(() => {
    async function loadBusinessHours() {
      if (!business?.id) return
      try {
        const hours = await getBusinessHours()
        setBusinessHours(hours)
      } catch (err) {
        console.error('Error loading business hours:', err)
      }
    }
    loadBusinessHours()
  }, [business?.id])

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

  const LAST_SAVED_BUSINESS_KEY = 'brnno-settings-last-saved-business'

  async function loadBusiness() {
    try {
      setLoadingBusiness(true)
      setError(null)

      let businessData = await getBusiness()

      // If server returns null (e.g. RLS or transient), retry once so data doesn't "disappear" after save
      if (!businessData) {
        await new Promise(r => setTimeout(r, 500))
        businessData = await getBusiness()
      }

      if (businessData) {
        try {
          sessionStorage.removeItem(LAST_SAVED_BUSINESS_KEY)
        } catch { /* ignore */ }
        setBusiness(businessData)

        const businessWithAllFields = businessData as any

        if (!businessWithAllFields.subdomain || businessWithAllFields.subdomain.trim() === '') {
          const subdomainResult = await saveBusiness({
            name: businessWithAllFields.name,
            email: businessWithAllFields.email,
            phone: businessWithAllFields.phone,
            address: businessWithAllFields.address,
            city: businessWithAllFields.city,
            state: businessWithAllFields.state,
            zip: businessWithAllFields.zip,
            website: businessWithAllFields.website,
            description: businessWithAllFields.description,
          }, businessWithAllFields.id)

          if (subdomainResult.success && subdomainResult.data) {
            setBusiness(subdomainResult.data)
          }
        }
      } else {
        // Server returned null - use last-saved business from session if we have it (so form isn't "cleared" after save)
        try {
          const cached = sessionStorage.getItem(LAST_SAVED_BUSINESS_KEY)
          if (cached) {
            const parsed = JSON.parse(cached) as any
            if (parsed?.id) {
              setBusiness(parsed)
              setError('Your business was saved, but the server didn’t return it when loading. Showing last saved data—try refreshing the page to sync.')
              setLoadingBusiness(false)
              return
            }
          }
        } catch { /* ignore */ }
        setBusiness(null)
      }
    } catch (err) {
      console.error('Error loading business:', err)
      setBusiness(null)
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('No business found') && !msg.includes('Server Components render')) {
        setError(`Failed to load business information: ${msg}`)
      }
    } finally {
      setLoadingBusiness(false)
    }
  }

  useEffect(() => {
    loadBusiness()
  }, [])

  // Get user email to check if admin and current tier
  useEffect(() => {
    async function getUserEmailAndTier() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)

      // Get current tier
      const tier = await getCurrentTier()
      setCurrentTier(tier)
    }
    getUserEmailAndTier()
  }, [])

  // Initialize SMS provider settings when business loads
  useEffect(() => {
    if (business?.id) {
      // Default to Twilio for now (Surge is temporarily hidden)
      let provider: 'surge' | 'twilio' | null = null

      if (business.sms_provider === 'twilio') {
        provider = 'twilio'
      } else if (business.sms_provider === 'surge') {
        // Keep surge if already set, but don't show in UI
        provider = 'surge'
      } else {
        // Default to Twilio
        provider = 'twilio'
      }

      setSmsProvider(provider)
      setSurgeApiKey(business.surge_api_key || '')
      setSurgeAccountId(business.surge_account_id || '')
      setTwilioAccountSid(business.twilio_account_sid || '')
      setTwilioAuthToken(business.twilio_auth_token || '')
      setTwilioPhoneNumber(business.twilio_phone_number || '')
    }
  }, [business?.id])

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

      // Use server action to save business (returns { success, data } or { success: false, error })
      const result = await saveBusiness(businessData, business?.id)

      if (!result.success) {
        alert(result.error || 'Failed to save business.')
        setLoading(false)
        return
      }

      const savedBusiness = result.data
      setBusiness(savedBusiness)

      // Persist so if getBusiness() returns null when they come back (e.g. RLS), we can still show their data
      try {
        sessionStorage.setItem(LAST_SAVED_BUSINESS_KEY, JSON.stringify(savedBusiness))
      } catch { /* ignore */ }

      const reloadedBusiness = await getBusiness()
      if (reloadedBusiness) {
        setBusiness(reloadedBusiness)
        try {
          sessionStorage.removeItem(LAST_SAVED_BUSINESS_KEY)
        } catch { /* ignore */ }
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950 space-y-3">
          <p className="text-sm text-red-900 dark:text-red-100">
            <strong>Error:</strong> {error}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                loadBusiness()
              }}
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut()
                window.location.href = '/login'
              }}
            >
              Log out and sign in again
            </Button>
          </div>
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
        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 scroll-smooth overscroll-x-contain touch-pan-x">
          <TabsList className="inline-flex min-w-max h-auto sm:h-10 gap-1">
            <TabsTrigger value="business" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Business</TabsTrigger>
            <TabsTrigger value="brand" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Brand</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Schedule</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Pricing</TabsTrigger>
            <TabsTrigger value="discounts" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Discount Codes</TabsTrigger>
            <TabsTrigger value="services" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Services</TabsTrigger>
            {isAdminEmail(userEmail) && (
              <TabsTrigger value="channels" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Channels</TabsTrigger>
            )}
            {/* <TabsTrigger value="auto-assignment">Auto-Assignment</TabsTrigger> */} {/* Hidden - on back burner */}
            <TabsTrigger value="reviews" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Reviews</TabsTrigger>
            <TabsTrigger value="payments" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Payments</TabsTrigger>
            {currentTier === 'fleet' && (
              <TabsTrigger value="integrations" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Integrations</TabsTrigger>
            )}
            <TabsTrigger value="account" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">Account</TabsTrigger>
          </TabsList>
        </div>

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

        {/* Brand Settings Tab */}
        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Brand Settings</CardTitle>
              <CardDescription>
                Customize your brand appearance and messaging defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandSettingsForm
                business={business}
                onBusinessUpdate={setBusiness}
                loading={savingBrand}
                setLoading={setSavingBrand}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Settings Tab */}
        <TabsContent value="schedule">
          <div className="space-y-6">
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
                    return days.map((day, index) => {
                      const dayKey = day.toLowerCase()
                      const dayHours = businessHours?.[dayKey]
                      const isClosed = dayHours?.closed === true

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

                  <Separator />

                  {/* Lead Recovery Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Lead Recovery Settings</h3>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="dont_text_after_hours"
                        name="dont_text_after_hours"
                        defaultChecked={business?.dont_text_after_hours ?? true}
                        className="h-4 w-4 rounded"
                      />
                      <Label htmlFor="dont_text_after_hours" className="!mt-0">
                        Don't text leads after business hours
                      </Label>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-6">
                      Automated messages will only send during your business hours
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="send_at_8am_after_hours"
                        name="send_at_8am_after_hours"
                        defaultChecked={business?.send_at_8am_after_hours ?? true}
                        className="h-4 w-4 rounded"
                      />
                      <Label htmlFor="send_at_8am_after_hours" className="!mt-0">
                        If lead arrives after hours, send at 8am
                      </Label>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-6">
                      Leads received outside business hours will receive messages at 8am the next day
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loadingHours}>
                      {loadingHours ? 'Saving...' : 'Save Hours'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {business?.id && (
              <PriorityTimeBlocksSettings businessId={business.id} />
            )}
          </div>
        </TabsContent>

        {/* Condition Pricing Tab */}
        <TabsContent value="pricing">
          <ConditionSettings
            initialConfig={business?.condition_config || null}
            onSave={updateConditionConfig}
            loading={loading}
          />
        </TabsContent>

        {/* Discount Codes Tab */}
        <TabsContent value="discounts">
          {business && (
            <DiscountCodesSettings businessId={business.id} />
          )}
        </TabsContent>

        <TabsContent value="services">
          {business && <ServiceFeatureSettings />}
        </TabsContent>

        {/* Channels Settings Tab - Admin Only */}
        {isAdminEmail(userEmail) && (
          <TabsContent value="channels">
            <div className="space-y-6">
              {/* SMS Channel */}
              <Card>
                <CardHeader>
                  <CardTitle>SMS Channel</CardTitle>
                  <CardDescription>
                    Connect Twilio to send and receive SMS messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Provider Selection */}
                  {/* Surge temporarily hidden - new provider, may need to contact them for better docs */}
                  <div>
                    <Label>SMS Provider</Label>
                    <div className="mt-2">
                      <div className="p-4 rounded-lg border-2 border-violet-500 bg-violet-50 dark:bg-violet-950/30">
                        <div className="font-semibold mb-1">Twilio</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">Global SMS provider</div>
                      </div>
                      {/* Surge option hidden for now
                    <button
                      type="button"
                      onClick={() => setSmsProvider('surge')}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        smsProvider === 'surge'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-semibold mb-1">Surge</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Local SMS provider</div>
                    </button>
                    */}
                    </div>
                  </div>

                  {/* Surge Configuration - Temporarily hidden */}
                  {/* {smsProvider === 'surge' && (
                  <div className="space-y-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4">
                    <div>
                      <Label htmlFor="surge_account_id">Surge Account ID</Label>
                      <Input
                        id="surge_account_id"
                        value={surgeAccountId}
                        onChange={(e) => setSurgeAccountId(e.target.value)}
                        placeholder="acct_01kestebpne83r0nc7crmr7f4h"
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Your Surge account ID (e.g., acct_01kestebpne83r0nc7crmr7f4h)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="surge_api_key">Surge API Key</Label>
                      <Input
                        id="surge_api_key"
                        type="password"
                        value={surgeApiKey}
                        onChange={(e) => setSurgeApiKey(e.target.value)}
                        placeholder="sk_demo_..."
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Your Surge API key (starts with sk_)
                      </p>
                    </div>
                  </div>
                )} */}

                  {/* Twilio Configuration */}
                  {smsProvider === 'twilio' && (
                    <div className="space-y-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4">
                      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 mb-4">
                        <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold mb-1">
                          Bring Your Own Twilio Account
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Enter your own Twilio credentials to use SMS features. Don't have a Twilio account?
                          <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="underline ml-1">Sign up here</a> or
                          <span className="font-semibold"> subscribe to AI Auto Lead for automatic setup.</span>
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="twilio_account_sid">Twilio Account SID *</Label>
                        <Input
                          id="twilio_account_sid"
                          value={twilioAccountSid}
                          onChange={(e) => setTwilioAccountSid(e.target.value)}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="mt-1 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Find this in your Twilio Console
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="twilio_auth_token">Twilio Auth Token *</Label>
                        <Input
                          id="twilio_auth_token"
                          type="password"
                          value={twilioAuthToken}
                          onChange={(e) => setTwilioAuthToken(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="mt-1 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Your Twilio Auth Token (kept secure)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="twilio_phone_number">Twilio Phone Number *</Label>
                        <Input
                          id="twilio_phone_number"
                          value={twilioPhoneNumber}
                          onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                          placeholder="+15551234567"
                          className="mt-1 font-mono text-sm"
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Your Twilio phone number in E.164 format (e.g., +15551234567)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Connection Status and Save Button */}
                  <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${(smsProvider === 'surge' && surgeApiKey && surgeAccountId) ||
                          (smsProvider === 'twilio' && twilioAccountSid && twilioAuthToken && twilioPhoneNumber)
                          ? 'bg-green-500'
                          : 'bg-zinc-400'
                          }`} />
                        <span className="font-medium">
                          {((smsProvider === 'surge' && surgeApiKey && surgeAccountId) ||
                            (smsProvider === 'twilio' && twilioAccountSid && twilioAuthToken && twilioPhoneNumber))
                            ? 'Configured'
                            : 'Not Configured'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        if (!smsProvider) {
                          toast.error('Please select an SMS provider')
                          return
                        }
                        setSavingSMS(true)
                        try {
                          // Only send fields relevant to the selected provider
                          const settingsData: {
                            sms_provider: 'surge' | 'twilio'
                            surge_api_key?: string | null
                            surge_account_id?: string | null
                            twilio_account_sid?: string | null
                            twilio_auth_token?: string | null
                            twilio_phone_number?: string | null
                          } = {
                            sms_provider: smsProvider,
                          }

                          if (smsProvider === 'surge') {
                            settingsData.surge_api_key = surgeApiKey || null
                            settingsData.surge_account_id = surgeAccountId || null
                            // Note: Surge SDK doesn't require phone number - uses account default
                            // Don't include twilio fields when using Surge
                          } else if (smsProvider === 'twilio') {
                            // Save all Twilio credentials (businesses must bring their own)
                            settingsData.twilio_account_sid = twilioAccountSid || null
                            settingsData.twilio_auth_token = twilioAuthToken || null
                            settingsData.twilio_phone_number = twilioPhoneNumber || null
                            // Don't include surge fields when using Twilio
                          }

                          await updateSMSSettings(settingsData)
                          // Reload business data
                          const updatedBusiness = await getBusiness()
                          if (updatedBusiness) {
                            setBusiness(updatedBusiness)
                          }
                          toast.success('SMS settings saved successfully!')
                        } catch (error) {
                          console.error('Error saving SMS settings:', error)
                          toast.error(error instanceof Error ? error.message : 'Failed to save SMS settings')
                        } finally {
                          setSavingSMS(false)
                        }
                      }}
                      disabled={savingSMS || !smsProvider}
                    >
                      {savingSMS ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>

                  {/* Test SMS Button */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Check if business phone is valid
                        if (business?.phone && (business.phone.includes('X') || business.phone.includes('x') || business.phone.includes('*'))) {
                          toast.error('Your business phone number appears to be masked or incomplete. Please update it in Business Profile settings with a complete phone number.')
                          return
                        }

                        setTestingSMS(true)
                        try {
                          await sendTestSMS()
                          toast.success('Test SMS sent successfully! Check your phone.')
                        } catch (error) {
                          console.error('Error sending test SMS:', error)
                          const errorMessage = error instanceof Error ? error.message : 'Failed to send test SMS'
                          toast.error(errorMessage)

                          // If it's a phone number error, provide helpful guidance
                          if (errorMessage.includes('phone number') || errorMessage.includes('Phone Number')) {
                            toast.info('Make sure your business phone number in Business Profile is complete and in E.164 format (e.g., +15551234567)')
                          }
                        } finally {
                          setTestingSMS(false)
                        }
                      }}
                      disabled={
                        testingSMS ||
                        !((smsProvider === 'surge' && surgeApiKey && surgeAccountId) ||
                          (smsProvider === 'twilio'))
                      }
                      className="w-full"
                    >
                      {testingSMS ? 'Sending...' : 'Send Test SMS'}
                    </Button>
                    {business?.phone && (business.phone.includes('X') || business.phone.includes('x') || business.phone.includes('*')) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Your business phone number appears to be masked. Please update it in Business Profile settings.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Email Channel */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Channel</CardTitle>
                  <CardDescription>
                    Connect your email provider to send automated emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="font-medium">
                        Connected (Resend)
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast.info('Email is configured via Resend. Contact support to change email settings.')
                      }}
                    >
                      Info
                    </Button>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Provider:</p>
                    <code className="text-xs font-mono">Resend</code>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      Email sending is configured via environment variables. Test emails will be sent to your business email address ({business?.email || 'not set'}).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setTestingEmail(true)
                      try {
                        await sendTestEmail()
                        toast.success('Test email sent successfully! Check your inbox.')
                      } catch (error) {
                        console.error('Error sending test email:', error)
                        toast.error(error instanceof Error ? error.message : 'Failed to send test email')
                      } finally {
                        setTestingEmail(false)
                      }
                    }}
                    disabled={testingEmail}
                  >
                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Auto-Assignment Tab - Hidden - on back burner */}
        {/* <TabsContent value="auto-assignment">
          <AutoAssignmentSettings />
        </TabsContent> */}

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

        {/* Integrations Tab - Fleet Tier Only */}
        {currentTier === 'fleet' && (
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* API Keys Section */}
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access to BRNNO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business?.api_key ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Active API Key</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to regenerate your API key? The old key will stop working immediately.')) {
                                // TODO: Implement API key regeneration
                                alert('API key regeneration coming soon')
                              }
                            }}
                          >
                            Regenerate
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border rounded text-sm font-mono break-all">
                            {business.api_key}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(business.api_key)
                              alert('API key copied to clipboard!')
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                          Keep this key secret. Never share it publicly or commit it to version control.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        No API key generated yet. Generate one to enable programmatic access to your BRNNO account.
                      </p>
                      <Button
                        onClick={async () => {
                          if (confirm('Generate a new API key? This will allow programmatic access to your account.')) {
                            setGeneratingAPIKey(true)
                            try {
                              const result = await generateAPIKeyForBusiness()
                              // Reload business data
                              const updatedBusiness = await getBusiness()
                              if (updatedBusiness) {
                                setBusiness(updatedBusiness)
                              }
                              toast.success('API key generated successfully!')
                            } catch (error) {
                              console.error('Error generating API key:', error)
                              toast.error(error instanceof Error ? error.message : 'Failed to generate API key')
                            } finally {
                              setGeneratingAPIKey(false)
                            }
                          }
                        }}
                        disabled={generatingAPIKey}
                      >
                        {generatingAPIKey ? 'Generating...' : 'Generate API Key'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Webhook Endpoints Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>
                    Configure webhooks to receive real-time notifications about events in your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium mb-1">Webhook URL</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Your server endpoint that will receive webhook events
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddWebhook(true)
                          setWebhookUrl('')
                          setWebhookEvents([])
                        }}
                      >
                        Add Endpoint
                      </Button>
                    </div>

                    {business?.webhook_endpoints && Array.isArray(business.webhook_endpoints) && business.webhook_endpoints.length > 0 ? (
                      <div className="space-y-2">
                        {(business.webhook_endpoints as any[]).map((endpoint: any) => (
                          <div
                            key={endpoint.id || endpoint.url}
                            className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-900"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono truncate">{endpoint.url}</code>
                                <div className={`h-2 w-2 rounded-full ${endpoint.active !== false ? 'bg-green-500' : 'bg-zinc-400'}`} />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                                <span>Events: {endpoint.events && endpoint.events.length > 0 ? endpoint.events.join(', ') : 'All'}</span>
                                {endpoint.last_triggered && (
                                  <span>Last triggered: {new Date(endpoint.last_triggered).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const webhookId = endpoint.id
                                  if (!webhookId) {
                                    toast.error('Webhook ID not found')
                                    return
                                  }
                                  setTestingWebhook(webhookId)
                                  try {
                                    const result = await testWebhookEndpoint(webhookId)
                                    // Reload business data
                                    const updatedBusiness = await getBusiness()
                                    if (updatedBusiness) {
                                      setBusiness(updatedBusiness)
                                    }
                                    if (result.success) {
                                      toast.success(`Webhook test successful! Status: ${result.status}`)
                                    } else {
                                      toast.error(`Webhook test failed: ${result.message}`)
                                    }
                                  } catch (error) {
                                    console.error('Error testing webhook:', error)
                                    toast.error(error instanceof Error ? error.message : 'Failed to test webhook')
                                  } finally {
                                    setTestingWebhook(null)
                                  }
                                }}
                                disabled={testingWebhook === endpoint.id || endpoint.active === false}
                              >
                                {testingWebhook === endpoint.id ? 'Testing...' : 'Test'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to remove this webhook endpoint?')) {
                                    const webhookId = endpoint.id
                                    if (!webhookId) {
                                      toast.error('Webhook ID not found')
                                      return
                                    }
                                    try {
                                      await removeWebhookEndpoint(webhookId)
                                      // Reload business data
                                      const updatedBusiness = await getBusiness()
                                      if (updatedBusiness) {
                                        setBusiness(updatedBusiness)
                                      }
                                      toast.success('Webhook endpoint removed successfully')
                                    } catch (error) {
                                      console.error('Error removing webhook:', error)
                                      toast.error(error instanceof Error ? error.message : 'Failed to remove webhook')
                                    }
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          No webhook endpoints configured
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          Add a webhook endpoint to receive real-time notifications about leads, bookings, and other events
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Webhook Events Info */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                    <h4 className="font-semibold text-sm mb-2">Available Webhook Events</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                      <div>• lead.created</div>
                      <div>• lead.updated</div>
                      <div>• lead.booked</div>
                      <div>• lead.lost</div>
                      <div>• interaction.sent</div>
                      <div>• interaction.received</div>
                      <div>• job.created</div>
                      <div>• job.completed</div>
                      <div>• customer.created</div>
                      <div>• customer.updated</div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                      Webhooks are sent as POST requests with JSON payloads. Your endpoint should return a 200 status code to confirm receipt.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Add Webhook Dialog */}
              <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Webhook Endpoint</DialogTitle>
                    <DialogDescription>
                      Configure a webhook endpoint to receive real-time notifications
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!webhookUrl.trim()) {
                        toast.error('Please enter a webhook URL')
                        return
                      }
                      setAddingWebhook(true)
                      try {
                        await addWebhookEndpoint({
                          url: webhookUrl.trim(),
                          events: webhookEvents.length > 0 ? webhookEvents : undefined,
                          active: true,
                        })
                        // Reload business data
                        const updatedBusiness = await getBusiness()
                        if (updatedBusiness) {
                          setBusiness(updatedBusiness)
                        }
                        toast.success('Webhook endpoint added successfully!')
                        setShowAddWebhook(false)
                        setWebhookUrl('')
                        setWebhookEvents([])
                      } catch (error) {
                        console.error('Error adding webhook:', error)
                        toast.error(error instanceof Error ? error.message : 'Failed to add webhook endpoint')
                      } finally {
                        setAddingWebhook(false)
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="webhook_url">Webhook URL *</Label>
                      <Input
                        id="webhook_url"
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-server.com/webhooks/brnno"
                        className="mt-1 font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Your server endpoint that will receive POST requests
                      </p>
                    </div>
                    <div>
                      <Label>Events (Optional)</Label>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                        Leave empty to receive all events, or select specific events
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                        {[
                          'lead.created',
                          'lead.updated',
                          'lead.booked',
                          'lead.lost',
                          'interaction.sent',
                          'interaction.received',
                          'job.created',
                          'job.completed',
                          'customer.created',
                          'customer.updated',
                        ].map((event) => (
                          <label key={event} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={webhookEvents.includes(event)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWebhookEvents([...webhookEvents, event])
                                } else {
                                  setWebhookEvents(webhookEvents.filter((e) => e !== event))
                                }
                              }}
                              className="h-4 w-4 rounded"
                            />
                            <span className="text-xs font-mono">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddWebhook(false)
                          setWebhookUrl('')
                          setWebhookEvents([])
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingWebhook}>
                        {addingWebhook ? 'Adding...' : 'Add Webhook'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Third-Party Integrations Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Integrations</CardTitle>
                  <CardDescription>
                    Connect external services to extend BRNNO's capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Zapier Integration */}
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">Z</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Zapier</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Connect BRNNO to 5,000+ apps
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open('https://zapier.com/apps/brnno/integrations', '_blank')
                      }}
                    >
                      View Integration
                    </Button>
                  </div>

                  {/* Make (Integromat) Integration */}
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">M</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Make (Integromat)</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Automate workflows with visual builder
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open('https://www.make.com/en/integrations/brnno', '_blank')
                      }}
                    >
                      View Integration
                    </Button>
                  </div>

                  {/* Coming Soon */}
                  <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      More integrations coming soon
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      Request an integration at <a href="/contact" className="underline">support@brnno.com</a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

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
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm('Are you ABSOLUTELY sure? This will permanently delete your account, all business data, jobs, customers, and cannot be undone.')) {
                        return
                      }

                      if (!confirm('Last chance: Type DELETE in the next prompt to confirm')) {
                        return
                      }

                      const confirmation = prompt('Type DELETE to confirm account deletion:')
                      if (confirmation !== 'DELETE') {
                        toast.error('Account deletion cancelled')
                        return
                      }

                      try {
                        const response = await fetch('/api/delete-account', {
                          method: 'POST',
                        })

                        if (!response.ok) {
                          throw new Error('Failed to delete account')
                        }

                        toast.success('Account deleted successfully')
                        // Sign out and redirect to home
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = '/'
                      } catch (error: any) {
                        console.error('Error deleting account:', error)
                        toast.error(error.message || 'Failed to delete account')
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}
