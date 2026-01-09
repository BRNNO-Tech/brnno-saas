'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, DollarSign, ChevronRight, User, MapPin, Car, Mail, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { getAvailableTimeSlots, checkTimeSlotAvailability } from '@/lib/actions/schedule'
import AssetDetailsForm from './asset-details-form'
import { DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'

type Business = {
  id: string
  name: string
  subdomain: string
  stripe_account_id?: string | null
  industry?: string
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
}

type BookingStep = 1 | 2 | 3 | 4

export default function BookingForm({
  business,
  service
}: {
  business: Business
  service: Service
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<BookingStep>(1)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    smsConsent: false,
    phone: '',
    date: '',
    time: '',
    notes: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    assetDetails: {} as Record<string, any>
  })
  
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

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
        const duration = service.duration_minutes || 60
        const slots = await getAvailableTimeSlots(business.id, selectedDate, duration)
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

    if (currentStep === 2 && selectedDate) {
      loadSlots()
    }
  }, [selectedDate, business.id, service.duration_minutes, currentStep])

  // Track abandonment on unmount or navigation away
  useEffect(() => {
    return () => {
      if (leadId && currentStep < 4) {
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

  // Step 1: Create Lead (Email + Name)
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
          smsConsent: formData.smsConsent,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price || 0,
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
      setCurrentStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to start booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Date/Time
  async function handleStep2(e: React.FormEvent) {
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
      const duration = service.duration_minutes || 60
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
        duration
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
            step: 2,
            data: {
              preferredDate: formData.date,
              preferredTime: formData.time,
            },
          }),
        })
      }

      setCurrentStep(3)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Phone + Notes
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Update lead progress
      if (leadId) {
        await fetch('/api/booking/update-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            step: 3,
            data: {
              phone: formData.phone.trim() || null,
              notes: formData.notes.trim() || null,
            },
          }),
        })
      }

      setCurrentStep(4)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Address + Asset Details → Continue to Payment
  async function handleStep4(e: React.FormEvent<HTMLFormElement>) {
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
            step: 4,
          }),
        })
      }

      // Always redirect to checkout - let checkout page handle payment/no-payment
      // Save booking data to sessionStorage and redirect to checkout
      const bookingData = {
        businessId: business.id,
        leadId, // Include leadId for tracking
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price || 0,
          duration_minutes: service.duration_minutes,
        },
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
        },
        scheduledDate: formData.date,
        scheduledTime: formData.time,
        notes: formData.notes.trim() || null,
        assetDetails: Object.keys(assetDetails).length > 0 ? assetDetails : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim()
      }

      sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
      router.push(`/${business.subdomain}/book/checkout`)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <Link
          href={`/${business.subdomain}`}
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Book Appointment</CardTitle>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    step <= currentStep
                      ? 'bg-blue-600'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Step {currentStep} of 4
            </p>
          </CardHeader>
          <CardContent>
            {/* Service Details */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
              <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  {service.description}
                </p>
              )}
              <div className="flex gap-4 text-sm">
                {service.price && (
                  <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-green-600 dark:text-green-500">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                )}
                {service.duration_minutes && (
                  <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      ~
                      {service.duration_minutes % 60 === 0
                        ? `${service.duration_minutes / 60} ${service.duration_minutes / 60 === 1 ? 'hour' : 'hours'}`
                        : `${(service.duration_minutes / 60).toFixed(1)} hours`}
                    </span>
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
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Your Information</h3>
                  </div>
                  <div>
                    <Label htmlFor="name" className="mb-2 block">Your Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      type="text"
                      required
                      placeholder="John Doe"
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
                    />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="smsConsent"
                        checked={formData.smsConsent}
                        onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                        required
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      />
                      <Label htmlFor="smsConsent" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer leading-relaxed">
                        By continuing, you agree to receive automated messages from <span className="font-medium">{business.name}</span> about your booking and related services. Message and data rates may apply. Reply STOP to unsubscribe. Consent is not required to make a purchase.
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    We'll use this to send you booking confirmation and updates.
                  </p>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Continue'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {/* Step 2: Date/Time */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Choose Date & Time</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="mb-2 block">Preferred Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      min={today}
                      value={formData.date}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value })
                        setSelectedDate(e.target.value)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="mb-2 block">Preferred Time *</Label>
                    {loadingSlots ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 py-2">
                        Loading available times...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select
                        id="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-zinc-50"
                      >
                        <option value="">Select a time</option>
                        {availableSlots.map(slot => (
                          <option key={slot} value={slot}>
                            {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </option>
                        ))}
                      </select>
                    ) : selectedDate ? (
                      <Input
                        id="time"
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    ) : (
                      <Input
                        id="time"
                        type="time"
                        required
                        disabled
                        value=""
                        placeholder="Select a date first"
                      />
                    )}
                  </div>
                </div>
                {slotsError && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">{slotsError}</p>
                )}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Checking...' : 'Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Phone + Notes */}
            {currentStep === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Contact & Notes</h3>
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    We'll use this to contact you if needed about your appointment.
                  </p>
                </div>
                <div>
                  <Label htmlFor="notes" className="mb-2 block">Special Requests or Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions or requests..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : 'Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Address + Asset Details */}
            {currentStep === 4 && (
              <form 
                onSubmit={handleStep4}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Service Location & Details</h3>
                </div>
                <div>
                  <Label htmlFor="address" className="mb-2 block">Street Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="mb-2 block">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="Salt Lake City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="mb-2 block">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      placeholder="UT"
                      maxLength={2}
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
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-cyan-600" />
                    <Label className="mb-2 block">{business.industry === 'detailing' ? 'Vehicle' : 'Asset'} Details</Label>
                  </div>
                  <AssetDetailsForm
                    industry={business.industry || DEFAULT_INDUSTRY}
                    onChange={(details) => setFormData({ ...formData, assetDetails: details })}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Processing...' : 'Continue to Payment'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
