'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, DollarSign, ChevronRight, User, MapPin, Car, Mail, Phone, MessageSquare, Check, ChevronLeft, Star, Siren } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getAvailableTimeSlots, checkTimeSlotAvailability } from '@/lib/actions/schedule'
import AssetDetailsForm from './asset-details-form'
import { DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'
import VehicleSelector from './vehicle-selector'
import { calculateTotals, formatDuration, formatDurationHours, mapVehicleTypeToPricingKey } from '@/lib/utils/booking-utils'
import { getFeatureLabel } from '@/lib/utils/feature-labels'
import { Service } from '@/types'
import { BookingPhotoUpload } from './booking-photo-upload'
import { BookingLanguageSwitcher } from './booking-language-switcher'
import { getCustomerBookingTranslations, type CustomerBookingLang } from '@/lib/translations/customer-booking'
import { Camera } from 'lucide-react'

type Business = {
  id: string
  name: string
  subdomain: string
  stripe_account_id?: string | null
  industry?: string
  booking_banner_url?: string | null
  condition_config?: {
    enabled: boolean
    tiers: Array<{
      id: string
      label: string
      description: string
      markup_percent: number
    }>
  } | null
}

// Extended Service type for booking form that allows nullable fields from API
// This matches the Service interface but allows nullable values for fields that come from the API
type BookingService = Service & {
  base_price?: number | null
  price?: number | null
  duration_minutes?: number | null
}

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

// Format phone number as (***) ***-****
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '')

  // Limit to 10 digits
  const phoneNumberDigits = phoneNumber.slice(0, 10)

  // Format based on length
  if (phoneNumberDigits.length === 0) {
    return ''
  } else if (phoneNumberDigits.length <= 3) {
    return `(${phoneNumberDigits}`
  } else if (phoneNumberDigits.length <= 6) {
    return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3)}`
  } else {
    return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3, 6)}-${phoneNumberDigits.slice(6)}`
  }
}

export default function BookingForm({
  business,
  service,
  quote,
  hasAIPhotoAnalysis = false,
  lang = 'en'
}: {
  business: Business
  service: BookingService
  quote?: any
  hasAIPhotoAnalysis?: boolean
  lang?: 'en' | 'es'
}) {
  const router = useRouter()
  const t = getCustomerBookingTranslations((lang ?? 'en') as CustomerBookingLang)
  // If quote provided, skip to step 2 (Date/Time), otherwise start at step 1
  const [currentStep, setCurrentStep] = useState<BookingStep>(quote ? 2 : 1)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data - pre-fill from quote if available
  const [formData, setFormData] = useState({
    name: quote?.customer_name || '',
    email: quote?.customer_email || '',
    smsConsent: false,
    phone: quote?.customer_phone || '',
    date: '',
    time: '',
    notes: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    assetDetails: {
      size: null as string | null,
      color: null as string | null,
      year: '',
      make: '',
      model: '',
    },
    selectedAddons: [] as any[],
    vehicleType: null as string | null,
    vehicleColor: null as string | null,
    condition: (business.condition_config?.enabled && business.condition_config.tiers && business.condition_config.tiers.length > 0)
      ? (business.condition_config.tiers[0].id || 'clean')
      : 'clean', // Default to first tier or 'clean' if condition pricing disabled
  })

  const [addons, setAddons] = useState<any[]>([])
  const [loadingAddons, setLoadingAddons] = useState(false)

  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const today = new Date().toISOString().split('T')[0]

  // Calculate totals in real-time (runs on every render)
  // Use the mapped size from assetDetails if available, otherwise map vehicleType to pricing key
  // The VehicleSelector should set assetDetails.size correctly (van -> truck), but we ensure it here too
  const vehicleSizeForPricing = formData.assetDetails?.size || formData.vehicleType

  // Cast service to Service type with required fields (calculateTotals doesn't actually use is_active, created_at, updated_at)
  const serviceForCalculation: Service = {
    ...service,
    base_price: service.base_price ?? service.price ?? 0,
    is_active: service.is_active ?? true,
    created_at: service.created_at ?? new Date().toISOString(),
    updated_at: service.updated_at ?? new Date().toISOString(),
    is_popular: service.is_popular ?? false,
  } as Service

  // Map vehicle size to pricing key for calculation (handles van -> truck, etc.)
  const pricingKey = mapVehicleTypeToPricingKey(vehicleSizeForPricing)

  // Get condition config from business, or use default if not configured
  const conditionConfig = business.condition_config || null

  const totals = calculateTotals(
    serviceForCalculation,
    pricingKey,
    formData.selectedAddons,
    formData.condition,
    conditionConfig
  )

  // Load available time slots when date is selected
  useEffect(() => {
    async function loadSlots() {
      if (!selectedDate || selectedDate < today) {
        setAvailableSlots([])
        return
      }

      setLoadingSlots(true)
      setSlotsError(null)
      try {
        const duration = totals.duration
        const slots = await getAvailableTimeSlots(
          business.id,
          selectedDate,
          duration,
          undefined,
          formData.email,
          formData.phone
        )
        setAvailableSlots(slots)
        if (slots.length === 0) {
          setSlotsError('No available time slots for this date. Please try another date.')
        }
      } catch (err) {
        console.error('Error loading available slots:', err)
        setAvailableSlots([])
        setSlotsError('Unable to load available times. Please try again.')
      } finally {
        setLoadingSlots(false)
      }
    }

    // Load slots when on Date/Time step (step 5) and date is selected
    if (currentStep === 5 && selectedDate) {
      loadSlots()
    }
  }, [selectedDate, business.id, currentStep, totals.duration, formData.email, formData.phone])

  // Load available add-ons
  useEffect(() => {
    // Only load if both business and service IDs are available
    if (!business?.id || !service?.id) {
      setAddons([])
      return
    }

    async function loadAddons() {
      setLoadingAddons(true)
      try {
        console.log('[BookingForm] Loading add-ons for business:', business.id, 'service:', service.id)
        const response = await fetch(`/api/booking/addons?businessId=${business.id}&serviceId=${service.id}`)
        console.log('[BookingForm] Add-ons response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[BookingForm] Add-ons data received:', data)
          const addonsList = data.addons || []
          // Deduplicate by ID and ensure no add-ons are auto-selected
          const uniqueAddons = addonsList.filter((addon: any, index: number, self: any[]) =>
            index === self.findIndex((a: any) => a.id === addon.id)
          )
          console.log('[BookingForm] Setting addons:', uniqueAddons.length, 'addons')
          setAddons(uniqueAddons)
          // Ensure selectedAddons stays empty - no auto-selection
          setFormData(prev => ({ ...prev, selectedAddons: [] }))
        } else {
          // Try to get error message from response
          let errorMessage = `Failed to load add-ons (${response.status})`
          try {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json()
              // Only log if errorData has meaningful content
              if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                errorMessage = errorData.error || errorData.details || errorMessage
                console.error('[BookingForm] Error loading add-ons:', {
                  status: response.status,
                  error: errorData.error,
                  details: errorData.details,
                  hint: errorData.hint
                })
              } else {
                // Empty JSON response - just log status
                console.warn(`[BookingForm] Empty error response from add-ons API (${response.status})`)
              }
            } else {
              const text = await response.text()
              if (text && text.trim()) {
                errorMessage = text
                console.error('[BookingForm] Error loading add-ons (non-JSON):', text)
              } else {
                console.warn(`[BookingForm] Empty error response from add-ons API (${response.status})`)
              }
            }
          } catch (parseError) {
            console.error('[BookingForm] Error parsing error response:', parseError)
            console.error('[BookingForm] Response status:', response.status, response.statusText)
          }
          // Set empty add-ons array on error (don't break the flow)
          setAddons([])
        }
      } catch (err) {
        console.error('[BookingForm] Exception loading add-ons:', err)
        // Set empty add-ons array on exception (don't break the flow)
        setAddons([])
      } finally {
        setLoadingAddons(false)
      }
    }

    loadAddons()
  }, [business?.id, service?.id])

  // Track abandonment on unmount or navigation away
  useEffect(() => {
    return () => {
      if (leadId && currentStep < 5) {
        // Mark as abandoned at current step
        fetch('/api/booking/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: currentStep,
            abandoned: true,
          }),
        }).catch(console.error)
      }
    }
  }, [leadId, currentStep])

  // If quote provided, auto-create lead on mount to skip step 1
  useEffect(() => {
    async function createLeadFromQuote() {
      if (quote && !leadId && formData.name && formData.email) {
        try {
          const response = await fetch('/api/booking/create-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: business.id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone || null, // Already stored as digits only
              source: 'quote',
              interested_in_service_id: service.id,
              interested_in_service_name: service.name,
              estimated_value: quote.total_price || quote.total,
              notes: `Quote Code: ${quote.quote_code}`,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setLeadId(data.lead?.id ?? null)
          }
        } catch (error) {
          console.error('Error creating lead from quote:', error)
        }
      }
    }
    createLeadFromQuote()
  }, [quote, business.id, service.id, service.name, formData.name, formData.email, formData.phone, leadId])

  // Step 1: Create Lead (Email + Name + Phone)
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        setError('Name and email are required')
        setLoading(false)
        return
      }

      // Validate phone number (must have at least 10 digits)
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (!phoneDigits || phoneDigits.length < 10) {
        setError('Please enter a valid 10-digit phone number')
        setLoading(false)
        return
      }

      if (!formData.smsConsent) {
        setError('Please consent to receive automated messages to continue')
        setLoading(false)
        return
      }

      const response = await fetch('/api/booking/create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone, // Already stored as digits only
          smsConsent: formData.smsConsent,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.base_price || service.price || 0,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Failed to create lead (${response.status})`
        try {
          const errorData = await response.json()
          console.error('Create lead error response:', errorData)
          errorMessage = errorData.error || errorData.details?.message || errorData.details?.hint || errorMessage
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text()
            console.error('Create lead error (text):', errorText)
            errorMessage = errorText || errorMessage
          } catch (textError) {
            console.error('Create lead error (status):', response.status, response.statusText)
            errorMessage = `${response.status} ${response.statusText}`
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      if (!result.lead || !result.lead.id) {
        throw new Error('Invalid response from server')
      }
      setLeadId(result.lead.id)
      setCurrentStep(2) // Step 2: Vehicle Selection
    } catch (err: any) {
      setError(err.message || 'Failed to start booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Vehicle Selection (no form submission, just continue)
  function handleVehicleContinue() {
    if (!formData.vehicleType) {
      setError('Please select a vehicle type')
      return
    }
    setError(null)
    setCurrentStep(3) // Go to condition step (smart step with AI or manual)
  }

  // Step 3: Condition Selection (smart step - AI result or manual selector)
  function handleConditionContinue() {
    if (!formData.condition) {
      setError('Please select a vehicle condition')
      return
    }
    setError(null)
    setCurrentStep(4) // Go to add-ons
  }

  // Step 4: Add-ons
  async function handleStep4(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // No validation needed for add-ons, just continue
    setCurrentStep(5) // Go to date/time
  }

  // Step 5: Date/Time
  async function handleStep5(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.date || !formData.time) {
        setError('Please select a date and time')
        setLoading(false)
        return
      }

      console.log('=== BOOKING SUBMISSION ===')
      console.log('Selected date:', formData.date)
      console.log('Selected time:', formData.time)
      console.log('Business ID:', business.id)
      console.log('Service duration:', service.duration_minutes || 60)

      // Check if date/time is in the future (using local time)
      const dateTime = new Date(`${formData.date}T${formData.time}`)
      if (dateTime < new Date()) {
        setError('Please select a date and time in the future')
        setLoading(false)
        return
      }

      // Check availability using local date/time (NOT ISO/UTC)
      const duration = totals.duration
      console.log('Calling checkTimeSlotAvailability with:', {
        businessId: business.id,
        date: formData.date,
        time: formData.time,
        duration
      })

      const isAvailable = await checkTimeSlotAvailability(
        business.id,
        formData.date, // Pass date as-is: "2024-01-15"
        formData.time, // Pass time as-is: "14:00"
        duration,
        undefined,
        formData.email,
        formData.phone
      )

      console.log('Availability check result:', isAvailable)
      console.log('=== END SUBMISSION ===')

      if (!isAvailable) {
        setError('This time slot is no longer available. Please select another time.')
        setLoading(false)
        return
      }

      // Update lead progress
      if (leadId) {
        await fetch('/api/booking/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: 3,
            data: {
              preferredDate: formData.date,
              preferredTime: formData.time,
            },
          }),
        })
      }

      setCurrentStep(6) // Go to notes step
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 6: Notes (phone already collected in Step 1)
  async function handleStep6(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Update lead progress (phone already saved in Step 1)
      if (leadId) {
        await fetch('/api/booking/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: 6,
            data: {
              notes: formData.notes.trim() || null,
            },
          }),
        })
      }

      setCurrentStep(7) // Go to final step (Address & Details)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 7: Address + Asset Details → Continue to Payment
  async function handleStep7(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Extract asset details from form
      const formDataObj = new FormData(e.currentTarget)
      const assetDetails: Record<string, any> = {}
      for (const [key, value] of Array.from(formDataObj.entries())) {
        if (key.startsWith('asset_')) {
          const fieldName = key.replace('asset_', '')
          if (value) assetDetails[fieldName] = value
        }
      }

      // Validation
      if (!formData.address || !formData.city || !formData.state || !formData.zip) {
        setError('Please fill in all address fields')
        setLoading(false)
        return
      }

      // Update lead progress
      if (leadId) {
        await fetch('/api/booking/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: 7,
          }),
        })
      }

      // Always redirect to checkout - let checkout page handle payment/no-payment
      // Save booking data to sessionStorage and redirect to checkout
      // Use the calculated totals which include vehicle size adjustments, condition fees, and addons
      const bookingData = {
        businessId: business.id,
        leadId, // Include leadId for tracking
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          price: totals.price, // Use calculated total price (includes vehicle size adjustments, condition fees, and addons)
          base_price: service.base_price || service.price || 0, // Keep base price for reference
          duration_minutes: totals.duration, // Use calculated total duration
          base_duration: service.base_duration || service.estimated_duration || service.duration_minutes || 60, // Keep base duration for reference
          pricing_model: service.pricing_model,
          variations: service.variations,
        },
        addons: formData.selectedAddons,
        totalPrice: totals.price, // Total including vehicle adjustments, condition fees, and addons
        breakdown: totals.breakdown, // Include breakdown for checkout display
        vehicleSize: vehicleSizeForPricing, // Store vehicle size for reference
        condition: formData.condition, // Store condition for reference
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
        },
        scheduledDate: formData.date,
        scheduledTime: formData.time,
        timezoneOffset: new Date().getTimezoneOffset(), // Pass timezone offset in minutes
        notes: formData.notes.trim() || null,
        assetDetails: Object.keys(assetDetails).length > 0 ? assetDetails : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim()
      }

      sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
      router.push(`/${business.subdomain}/book/checkout${lang === 'es' ? '?lang=es' : ''}`)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
      setLoading(false)
    }
  }

  const bookQuery: Record<string, string> = { service: service.id }
  if (quote?.quote_code) bookQuery.quote = quote.quote_code

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="fixed top-4 right-4 z-50">
        <BookingLanguageSwitcher subdomain={business.subdomain} path="/book" query={bookQuery} lang={lang} />
      </div>
      {/* Booking Banner */}
      {business.booking_banner_url && (
        <div className="w-full">
          <img
            src={business.booking_banner_url}
            alt={`${business.name} banner`}
            className="w-full h-48 sm:h-56 md:h-64 object-cover"
          />
        </div>
      )}

      <div className="py-6 sm:py-12 pb-24 sm:pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <a
            href={`/${business.subdomain}${lang === 'es' ? '?lang=es' : ''}`}
            className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToServices}
          </a>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t.bookAppointment}</CardTitle>
              {/* Enhanced Progress Indicator */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t.stepOf} {currentStep} {t.of} 7
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {currentStep === 1 && t.step1Name}
                    {currentStep === 2 && t.step2Name}
                    {currentStep === 3 && t.step3Name}
                    {currentStep === 4 && t.step4Name}
                    {currentStep === 5 && t.step5Name}
                    {currentStep === 6 && t.step6Name}
                    {currentStep === 7 && t.step7Name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-2.5 rounded-full transition-all duration-300 ${step < currentStep
                        ? 'bg-green-600'
                        : step === currentStep
                          ? 'bg-blue-600'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Enhanced Service Details Card - Matches Service List Format */}
              <div className="mb-6 bg-card rounded-lg border overflow-hidden">
                {/* Service Image */}
                {service.image_url && (
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      className="object-cover"
                      unoptimized={service.image_url.startsWith('http://127.0.0.1') || service.image_url.startsWith('http://localhost')}
                    />

                    {/* Popular Badge */}
                    {!quote && service.is_popular && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {t.popular.toUpperCase()}
                      </div>
                    )}

                    {quote && (
                      <div className="absolute top-3 right-3 bg-green-500 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
                        {t.quote}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Content */}
                <div className="p-6 space-y-4">
                  {quote && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <span className="font-semibold">{t.quoteCode}</span> {quote.quote_code}
                      </p>
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
                      {quote ? t.yourCustomQuote : service.name}
                    </h3>
                    {quote ? (
                      <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                        Vehicle: {quote.vehicle_type} • Condition: {quote.vehicle_condition}
                      </p>
                    ) : service.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Duration - Shows calculated totals in real-time */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {quote
                          ? `$${(quote.total_price || quote.total || 0).toFixed(2)}`
                          : `$${totals.price.toFixed(2)}`
                        }
                        {vehicleSizeForPricing && service.pricing_model === 'variable' && totals.price !== (service.base_price || service.price || 0) && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({vehicleSizeForPricing})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {quote
                          ? formatDurationHours(service.duration_minutes || 60)
                          : formatDurationHours(totals.duration)
                        }
                        {vehicleSizeForPricing && service.pricing_model === 'variable' && totals.duration !== (service.base_duration || service.estimated_duration || service.duration_minutes || 60) && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({vehicleSizeForPricing})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Summary (only show if vehicle or add-ons selected) - Show on all steps after vehicle selection */}
                  {(vehicleSizeForPricing || formData.selectedAddons.length > 0 || formData.condition !== 'clean') && !quote && currentStep >= 2 && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2 uppercase tracking-wide">
                        Booking Summary
                      </p>
                      <div className="space-y-1.5 text-sm">
                        {/* Base Service */}
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">{service.name}</span>
                          <span className="font-medium">${(totals.breakdown?.base || service.base_price || service.price || 0).toFixed(2)}</span>
                        </div>

                        {/* Vehicle Adjustment - Show if vehicle selected and service has variable pricing */}
                        {totals.breakdown?.sizeFee !== undefined && totals.breakdown.sizeFee !== 0 && (
                          <div className="flex justify-between text-blue-600 dark:text-blue-400">
                            <span>Vehicle Size ({vehicleSizeForPricing})</span>
                            <span>+${totals.breakdown.sizeFee.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Condition Fee - Show if condition is not 'clean' */}
                        {totals.breakdown?.conditionFee !== undefined && totals.breakdown.conditionFee !== 0 && (
                          <div className="flex justify-between text-amber-600 dark:text-amber-400">
                            <span>Condition Fee</span>
                            <span>+${totals.breakdown.conditionFee.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Add-ons */}
                        {formData.selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-zinc-500 dark:text-zinc-400">
                            <span>+ {addon.name}</span>
                            <span>${(addon.price || 0).toFixed(2)}</span>
                          </div>
                        ))}

                        <div className="border-t border-blue-200 dark:border-blue-700 my-2"></div>

                        {/* Totals - Always show calculated totals */}
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{t.totalPrice}</span>
                          <span className="text-xl font-bold text-green-600 dark:text-green-400">
                            ${totals.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-600 dark:text-zinc-400">Est. Duration</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatDuration(totals.duration)}
                          </span>
                        </div>

                        {/* Safety Net Note */}
                        {(formData.condition === 'heavy' || formData.condition === 'extreme') && (
                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-medium mb-1">📋 Estimate Note:</p>
                            <p>This is an estimate based on the condition selected. If the vehicle requires significantly more work (e.g., undeclared sand or mold), the final invoice may be adjusted upon inspection.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* What's Included (if available) */}
                  {service.whats_included && Array.isArray(service.whats_included) && service.whats_included.length > 0 && (
                    <div className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded-lg">
                      <p className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">{t.whatsIncluded}:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {service.whats_included.map((item: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-700 dark:text-zinc-300">{getFeatureLabel(item)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Step 1: Email + Name */}
              {currentStep === 1 && (
                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.step1Name}</h3>
                    </div>
                    <div>
                      <Label htmlFor="name" className="mb-2 block">{t.nameLabel}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        type="text"
                        required
                        placeholder={t.namePlaceholder}
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-2 block">Email *</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="mb-2 block">{t.phoneLabel} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formatPhoneNumber(formData.phone)}
                        onChange={(e) => {
                          // Store only digits in state, but display formatted
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setFormData({ ...formData, phone: digits })
                        }}
                        required
                        placeholder="(555) 123-4567"
                        className="h-11 text-base"
                        maxLength={14} // (555) 123-4567 = 14 characters
                      />
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {t.weWillConfirm}
                      </p>
                    </div>
                    {/* SMS Consent - Cleaner Design */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="smsConsent"
                          checked={formData.smsConsent}
                          onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                          required
                          className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1">
                          <Label htmlFor="smsConsent" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer block">
                            <span className="font-medium">I agree to receive automated messages</span> from <span className="font-semibold text-blue-600 dark:text-blue-400">{business.name}</span> about my booking and related services.
                          </Label>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                            Message and data rates may apply. Reply STOP to unsubscribe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                    {loading ? t.creating : t.continue}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              )}

              {/* Step 2: Vehicle Selection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.selectYourVehicle}</h3>
                  </div>
                  <VehicleSelector
                    onSelect={(vehicle) => {
                      setFormData((prev) => ({
                        ...prev,
                        vehicleType: vehicle.type || null,
                        vehicleColor: vehicle.color || null,
                        assetDetails: {
                          ...prev.assetDetails,
                          size: vehicle.size || null,
                          color: vehicle.color || null,
                          year: vehicle.year,
                          make: vehicle.make,
                          model: vehicle.model,
                        },
                      }))
                    }}
                    initialValue={{
                      asset_size: formData.assetDetails.size || undefined,
                      asset_color: formData.assetDetails.color || undefined,
                      asset_year: formData.assetDetails.year || undefined,
                      asset_make: formData.assetDetails.make || undefined,
                      asset_model: formData.assetDetails.model || undefined,
                    }}
                  />


                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="w-full sm:w-auto h-12"
                    >
                      {t.back}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVehicleContinue}
                      className="flex-1 h-12 text-base"
                    >
                      {t.continue}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Vehicle Condition (Smart Step - AI or Manual) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Siren className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.howDirtyIsVehicle}</h3>
                  </div>

                  {/* Path A: AI Enabled - Show photo upload + AI result */}
                  {hasAIPhotoAnalysis && leadId && (
                    <div className="space-y-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        Upload photos of your vehicle to get AI-powered condition analysis, or skip to manually select your vehicle's condition.
                      </p>
                      <BookingPhotoUpload
                        leadId={leadId}
                        businessId={business.id}
                        initialPhotos={[]}
                        onPhotosChange={(photos) => {
                          // Check if any photos have AI analysis
                          const analyzedPhotos = photos.filter(p => p.ai_processed && p.ai_analysis)
                          if (analyzedPhotos.length > 0) {
                            // Get the worst condition from all analyzed photos
                            const conditions = analyzedPhotos
                              .map(p => p.ai_analysis?.condition_assessment)
                              .filter(Boolean) as string[]

                            // Map AI condition to business condition tiers
                            if (conditions.length > 0) {
                              // Find matching tier based on condition
                              const conditionPriority: Record<string, number> = {
                                'lightly_dirty': 1,
                                'moderately_dirty': 2,
                                'heavily_soiled': 3,
                                'extreme': 4
                              }

                              const worstCondition = conditions.reduce((worst, current) =>
                                (conditionPriority[current] || 0) > (conditionPriority[worst] || 0) ? current : worst,
                                conditions[0]
                              )

                              // Map to business tier (simplified - you may need to adjust based on your tier structure)
                              if (business.condition_config?.tiers) {
                                // Try to match based on condition severity
                                const tierMap: Record<string, string> = {
                                  'lightly_dirty': business.condition_config.tiers.find(t => t.markup_percent === 0)?.id || 'clean',
                                  'moderately_dirty': business.condition_config.tiers.find(t => t.markup_percent > 0 && t.markup_percent <= 0.15)?.id || business.condition_config.tiers[1]?.id || 'moderate',
                                  'heavily_soiled': business.condition_config.tiers.find(t => t.markup_percent > 0.15 && t.markup_percent <= 0.35)?.id || business.condition_config.tiers[2]?.id || 'disaster',
                                  'extreme': business.condition_config.tiers.find(t => t.markup_percent > 0.35)?.id || business.condition_config.tiers[business.condition_config.tiers.length - 1]?.id || 'disaster'
                                }

                                const suggestedTier = tierMap[worstCondition] || business.condition_config.tiers[0]?.id
                                if (suggestedTier) {
                                  setFormData(prev => ({ ...prev, condition: suggestedTier as any }))
                                }
                              }
                            }
                          }
                        }}
                      />

                      {/* Show AI Analysis Result if available */}
                      {(() => {
                        // This would need to be tracked in state, but for now we'll show manual selector as fallback
                        return null
                      })()}
                    </div>
                  )}

                  {/* Path B: Manual Condition Selector (always show as fallback) */}
                  {business.condition_config?.enabled && business.condition_config.tiers && business.condition_config.tiers.length > 0 && (
                    <div className="mt-6">
                      <Label className="mb-3 block text-base font-semibold">
                        {hasAIPhotoAnalysis ? t.orSelectManually : t.selectCondition}
                      </Label>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        This helps us provide an accurate price estimate.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {business.condition_config.tiers.map((tier, index) => {
                          const getTierStyle = (markup: number) => {
                            if (markup === 0) {
                              return {
                                icon: Check,
                                color: 'text-green-700',
                                bg: 'bg-green-50',
                                border: 'border-green-300',
                                darkBg: 'dark:bg-green-900/20',
                                darkBorder: 'dark:border-green-800'
                              }
                            } else if (markup <= 0.15) {
                              return {
                                icon: Car,
                                color: 'text-blue-700',
                                bg: 'bg-blue-50',
                                border: 'border-blue-300',
                                darkBg: 'dark:bg-blue-900/20',
                                darkBorder: 'dark:border-blue-800'
                              }
                            } else if (markup <= 0.25) {
                              return {
                                icon: Car,
                                color: 'text-amber-700',
                                bg: 'bg-amber-50',
                                border: 'border-amber-300',
                                darkBg: 'dark:bg-amber-900/20',
                                darkBorder: 'dark:border-amber-800'
                              }
                            } else {
                              return {
                                icon: Siren,
                                color: 'text-red-700',
                                bg: 'bg-red-50',
                                border: 'border-red-300',
                                darkBg: 'dark:bg-red-900/20',
                                darkBorder: 'dark:border-red-800'
                              }
                            }
                          }

                          const style = getTierStyle(tier.markup_percent)
                          const Icon = style.icon
                          const isSelected = formData.condition === tier.id

                          return (
                            <label
                              key={tier.id || index}
                              className="relative cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="vehicle_condition"
                                value={tier.id}
                                checked={isSelected}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                                className="peer sr-only"
                              />
                              <div className={`p-4 border-2 rounded-lg transition-all hover:border-opacity-80 ${isSelected
                                ? `${style.border} ${style.bg} ${style.darkBg} ${style.darkBorder} border-opacity-100`
                                : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400'
                                }`}>
                                <div className="flex items-start gap-3">
                                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isSelected ? style.color : 'text-zinc-500 dark:text-zinc-400'}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className={`font-medium text-sm ${isSelected ? style.color : 'text-zinc-900 dark:text-zinc-50'}`}>
                                        {tier.label}
                                      </p>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{tier.description}</p>
                                  </div>
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto h-12"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConditionContinue}
                      className="flex-1 h-12 text-base"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Add-ons */}
              {currentStep === 4 && (
                <form onSubmit={handleStep4} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
<h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.addExtrasOptional}</h3>
                    </div>
                    {loadingAddons ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.loading}</p>
                  ) : addons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addons.map((addon) => {
                        const isSelected = formData.selectedAddons.some(a => a.id === addon.id)
                        return (
                          <div
                            key={addon.id}
                            onClick={() => {
                              if (isSelected) {
                                setFormData((prev) => ({
                                  ...prev,
                                  selectedAddons: prev.selectedAddons.filter(a => a.id !== addon.id)
                                }))
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  selectedAddons: [...prev.selectedAddons, addon]
                                }))
                              }
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{addon.icon || '⭐'}</span>
                                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                    {addon.name}
                                  </h4>
                                </div>
                                {addon.description && (
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                    {addon.description}
                                  </p>
                                )}
                                <p className="text-lg font-bold text-purple-600">
                                  ${Number(addon.price).toFixed(2)}
                                </p>
                              </div>
                              <div
                                className={`ml-3 w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-zinc-300 dark:border-zinc-600'
                                  }`}
                              >
                                {isSelected && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                      No add-ons available at this time.
                    </p>
                  )}
                  {formData.selectedAddons.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="font-semibold">{t.selected}</span>{' '}
                        {formData.selectedAddons.map(a => a.name).join(', ')}
                      </p>
                      <p className="text-sm font-semibold text-purple-600 mt-1">
                        Add-ons Total: ${formData.selectedAddons.reduce((sum, a) => sum + Number(a.price), 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:w-auto h-12"
                    >
                      {t.back}
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                      {loading ? t.loading : t.continue}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 5: Date/Time */}
              {currentStep === 5 && (
                <form onSubmit={handleStep5} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.chooseDateAndTime}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Picker with Calendar Popup */}
                    <div className="relative">
                      <Label htmlFor="date" className="mb-2 block">{t.preferredDate}</Label>
                      <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="flex h-11 w-full items-center justify-between rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-base shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <span className={formData.date ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'}>
                          {formData.date
                            ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                            : t.selectADate}
                        </span>
                        <Calendar className="h-4 w-4 text-zinc-500" />
                      </button>

                      {/* Calendar Popup */}
                      {showCalendar && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowCalendar(false)}
                          />
                          <div className="absolute z-50 mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  const prevMonth = new Date(calendarMonth)
                                  prevMonth.setMonth(prevMonth.getMonth() - 1)
                                  setCalendarMonth(prevMonth)
                                }}
                                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMonth = new Date(calendarMonth)
                                  nextMonth.setMonth(nextMonth.getMonth() + 1)
                                  setCalendarMonth(nextMonth)
                                }}
                                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  {day}
                                </div>
                              ))}
                              {(() => {
                                const year = calendarMonth.getFullYear()
                                const month = calendarMonth.getMonth()
                                const firstDay = new Date(year, month, 1)
                                const lastDay = new Date(year, month + 1, 0)
                                const daysInMonth = lastDay.getDate()
                                const startingDayOfWeek = firstDay.getDay()
                                const days: React.ReactElement[] = []

                                // Empty cells for days before month starts
                                for (let i = 0; i < startingDayOfWeek; i++) {
                                  days.push(<div key={`empty-${i}`} className="p-2" />)
                                }

                                // Days of the month
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                  const isPast = dateStr < today
                                  const isSelected = formData.date === dateStr
                                  const isToday = dateStr === today

                                  days.push(
                                    <button
                                      key={day}
                                      type="button"
                                      disabled={isPast}
                                      onClick={() => {
                                        setFormData({ ...formData, date: dateStr })
                                        setSelectedDate(dateStr)
                                        setShowCalendar(false)
                                      }}
                                      className={`p-2 rounded-md text-sm transition-colors ${isPast
                                        ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                        : isSelected
                                          ? 'bg-blue-600 text-white font-semibold'
                                          : isToday
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50'
                                        }`}
                                    >
                                      {day}
                                    </button>
                                  )
                                }

                                return days
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Time Slot Picker */}
                    <div>
                      <Label htmlFor="time" className="mb-2 block">{t.preferredTime}</Label>
                      {loadingSlots ? (
                        <div className="h-11 flex items-center px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-50 dark:bg-zinc-800">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {t.loadingAvailableTimes}
                          </p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-2">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.map(slot => {
                              const [hours, minutes] = slot.split(':').map(Number)
                              const isPM = hours >= 12
                              const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
                              const displayMinutes = minutes.toString().padStart(2, '0')
                              const period = isPM ? 'PM' : 'AM'
                              const isSelected = formData.time === slot

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, time: slot })}
                                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700'
                                    } border-2 ${isSelected
                                      ? 'border-blue-600'
                                      : 'border-transparent'
                                    }`}
                                >
                                  {displayHours}:{displayMinutes} {period}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : selectedDate >= today ? (
                        <div className="space-y-2">
                          <div className="h-11 flex items-center px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-md bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              No available time slots for this date
                            </p>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Try selecting a different date or contact us directly
                          </p>
                        </div>
                      ) : (
                        <div className="h-11 flex items-center px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-50 dark:bg-zinc-800">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {t.selectDateFirst}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {slotsError && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">{slotsError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                      className="w-full sm:w-auto h-12"
                    >
                      {t.back}
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                      {loading ? t.checking : t.continue}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 6: Notes (phone already collected in Step 1) */}
              {currentStep === 6 && (
                <form onSubmit={handleStep6} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{t.step6Name}</h3>
                  </div>
                  <div>
                    <Label htmlFor="notes" className="mb-2 block">{t.specialRequestsOptional}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t.specialInstructionsPlaceholder}
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(5)}
                      className="w-full sm:w-auto h-12"
                    >
                      {t.back}
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                      {loading ? t.saving : t.continue}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 7: Address + Enhanced Vehicle Details */}
              {currentStep === 7 && (
                <form
                  onSubmit={handleStep7}
                  className="space-y-6 pb-8 sm:pb-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-lg">{t.serviceLocation}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="mb-2 block">{t.streetAddress}</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        placeholder="123 Main St"
                        className="h-11 text-base" // Larger text for mobile
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="mb-2 block">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          placeholder="Salt Lake City"
                          className="h-11 text-base"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="mb-2 block">{t.stateLabel}</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                          required
                          placeholder="UT"
                          maxLength={2}
                          className="h-11 text-base uppercase"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip" className="mb-2 block">ZIP Code *</Label>
                        <Input
                          id="zip"
                          name="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          required
                          placeholder="84043"
                          className="h-11 text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Vehicle Details */}
                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="h-5 w-5 text-cyan-600" />
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-lg">
                        {business.industry === 'detailing' ? t.vehicleInfo : t.assetInfo}
                      </h3>
                    </div>

                    {business.industry === 'detailing' ? (
                      <div className="space-y-4">
                        {/* Year, Make, Model in responsive grid - Pre-populated from Step 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="vehicle_year" className="mb-2 block">Year *</Label>
                            <select
                              id="vehicle_year"
                              name="asset_year"
                              required
                              value={formData.assetDetails?.year ?? ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                assetDetails: {
                                  size: prev.assetDetails?.size ?? null,
                                  color: prev.assetDetails?.color ?? null,
                                  year: e.target.value,
                                  make: prev.assetDetails?.make ?? '',
                                  model: prev.assetDetails?.model ?? '',
                                }
                              }))}
                              className="flex h-11 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <option value="">Select year</option>
                              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="vehicle_make" className="mb-2 block">Make *</Label>
                            <select
                              id="vehicle_make"
                              name="asset_make"
                              required
                              value={formData.assetDetails?.make ?? ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                assetDetails: {
                                  size: prev.assetDetails?.size ?? null,
                                  color: prev.assetDetails?.color ?? null,
                                  year: prev.assetDetails?.year ?? '',
                                  make: e.target.value,
                                  model: prev.assetDetails?.model ?? '',
                                }
                              }))}
                              className="flex h-11 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <option value="">Select make</option>
                              <option value="Honda">Honda</option>
                              <option value="Toyota">Toyota</option>
                              <option value="Ford">Ford</option>
                              <option value="Chevrolet">Chevrolet</option>
                              <option value="BMW">BMW</option>
                              <option value="Mercedes-Benz">Mercedes-Benz</option>
                              <option value="Audi">Audi</option>
                              <option value="Volkswagen">Volkswagen</option>
                              <option value="Nissan">Nissan</option>
                              <option value="Mazda">Mazda</option>
                              <option value="Subaru">Subaru</option>
                              <option value="Hyundai">Hyundai</option>
                              <option value="Kia">Kia</option>
                              <option value="Tesla">Tesla</option>
                              <option value="Lexus">Lexus</option>
                              <option value="Jeep">Jeep</option>
                              <option value="RAM">RAM</option>
                              <option value="GMC">GMC</option>
                              <option value="Dodge">Dodge</option>
                              <option value="Acura">Acura</option>
                              <option value="Infiniti">Infiniti</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="vehicle_model" className="mb-2 block">Model *</Label>
                            <Input
                              id="vehicle_model"
                              name="asset_model"
                              required
                              value={formData.assetDetails?.model ?? ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                assetDetails: {
                                  size: prev.assetDetails?.size ?? null,
                                  color: prev.assetDetails?.color ?? null,
                                  year: prev.assetDetails?.year ?? '',
                                  make: prev.assetDetails?.make ?? '',
                                  model: e.target.value,
                                }
                              }))}
                              placeholder="e.g., Civic"
                              className="text-base h-11"
                            />
                          </div>
                        </div>

                        {/* Vehicle Type Display (Read-only) */}
                        {formData.assetDetails?.size && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Vehicle Type:</span>
                              <span className="text-sm text-zinc-900 dark:text-zinc-50 capitalize">
                                {formData.assetDetails.size === 'truck' ? 'Truck' :
                                  formData.assetDetails.size === 'suv' ? 'SUV' :
                                    formData.assetDetails.size === 'sedan' ? 'Sedan' :
                                      formData.assetDetails.size === 'van' ? 'Van' :
                                        formData.assetDetails.size}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Color Display (Read-only) - Already selected in Step 2 */}
                        {formData.assetDetails?.color && (
                          <div>
                            <Label className="mb-2 block">Color</Label>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full border-2 border-zinc-300 dark:border-zinc-600"
                                style={{
                                  backgroundColor: formData.assetDetails.color === 'white' ? '#ffffff' :
                                    formData.assetDetails.color === 'silver' ? '#C0C0C0' :
                                      formData.assetDetails.color === 'black' ? '#000000' :
                                        formData.assetDetails.color === 'gray' ? '#808080' :
                                          formData.assetDetails.color === 'red' ? '#DC2626' :
                                            formData.assetDetails.color === 'blue' ? '#2563EB' :
                                              formData.assetDetails.color === 'brown' ? '#78350F' :
                                                formData.assetDetails.color === 'green' ? '#059669' :
                                                  formData.assetDetails.color === 'yellow' ? '#EAB308' :
                                                    formData.assetDetails.color === 'orange' ? '#EA580C' :
                                                      formData.assetDetails.color === 'purple' ? '#9333EA' :
                                                        '#808080'
                                }}
                              />
                              <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                                {formData.assetDetails.color}
                              </span>
                            </div>
                            {/* Hidden input for form submission */}
                            <input
                              type="hidden"
                              name="asset_color"
                              value={formData.assetDetails.color}
                            />
                            <input
                              type="hidden"
                              name="asset_size"
                              value={formData.assetDetails.size || ''}
                            />
                          </div>
                        )}

                        {/* Condition removed - now in Step 2 */}
                      </div>
                    ) : (
                      <AssetDetailsForm
                        industry={business.industry || DEFAULT_INDUSTRY}
                        onChange={(details) => setFormData({ ...formData, assetDetails: details })}
                      />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-4 sm:pb-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(6)}
                      className="w-full sm:w-auto h-12 text-base order-2 sm:order-1"
                    >
                      {t.back}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:flex-1 h-12 text-base order-1 sm:order-2"
                    >
                      {loading ? t.processing : t.continueToPayment}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sticky Price Bar (Mobile) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${totals.price.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {formatDuration(totals.duration)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Step {currentStep} of 7</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 w-3 rounded-full ${step <= currentStep ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
