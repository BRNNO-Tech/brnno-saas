'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, DollarSign, ChevronRight, User, MapPin, Car, Mail, Phone, MessageSquare, Check, ChevronLeft } from 'lucide-react'
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
  whats_included?: string[] | null
  estimated_duration?: number | null
  is_popular?: boolean | null
}

type BookingStep = 1 | 2 | 3 | 4 | 5

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
    assetDetails: {} as Record<string, any>,
    selectedAddons: [] as any[]
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

    // Load slots when on Date/Time step (step 2) and date is selected
    if (currentStep === 2 && selectedDate) {
      loadSlots()
    }
  }, [selectedDate, business.id, service.duration_minutes, currentStep])

  // Load available add-ons
  useEffect(() => {
    async function loadAddons() {
      setLoadingAddons(true)
      try {
        console.log('[BookingForm] Loading add-ons for business:', business.id)
        const response = await fetch(`/api/booking/addons?businessId=${business.id}`)
        console.log('[BookingForm] Add-ons response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[BookingForm] Add-ons data received:', data)
          const addonsList = data.addons || []
          console.log('[BookingForm] Setting addons:', addonsList.length, 'addons')
          setAddons(addonsList)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[BookingForm] Error loading add-ons:', errorData)
        }
      } catch (err) {
        console.error('[BookingForm] Exception loading add-ons:', err)
      } finally {
        setLoadingAddons(false)
      }
    }

    loadAddons()
  }, [business.id])

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
      setCurrentStep(2) // This is now add-ons
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
            step: 3,
            data: {
              preferredDate: formData.date,
              preferredTime: formData.time,
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

  // Step 3: Phone + Notes
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate phone number
      if (!formData.phone || !formData.phone.trim()) {
        setError('Phone number is required')
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
            data: {
              phone: formData.phone.trim(),
              notes: formData.notes.trim() || null,
            },
          }),
        })
      }

      setCurrentStep(5)
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
            step: 5,
          }),
        })
      }

      // Always redirect to checkout - let checkout page handle payment/no-payment
      // Save booking data to sessionStorage and redirect to checkout
      const totalPrice = (service.price || 0) + formData.selectedAddons.reduce((sum, a) => sum + a.price, 0)

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
        addons: formData.selectedAddons,
        totalPrice,
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 py-6 sm:py-12 pb-24 sm:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Book Appointment</CardTitle>
            {/* Enhanced Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Step {currentStep} of 5
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {currentStep === 1 && 'Your Information'}
                  {currentStep === 2 && 'Add Extras'}
                  {currentStep === 3 && 'Date & Time'}
                  {currentStep === 4 && 'Contact Details'}
                  {currentStep === 5 && 'Location & Vehicle'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
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
            {/* Enhanced Service Details Card */}
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      {service.description}
                    </p>
                  )}
                </div>
                {service.is_popular && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-4">
                {service.price && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Price</p>
                      <p className="text-lg font-bold text-green-600">
                        ${service.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                {(service.duration_minutes || service.estimated_duration) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Duration</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {(service.duration_minutes || service.estimated_duration || 0) % 60 === 0
                          ? `${(service.duration_minutes || service.estimated_duration || 0) / 60}h`
                          : `${((service.duration_minutes || service.estimated_duration || 0) / 60).toFixed(1)}h`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* What's Included (if available) */}
              {service.whats_included && Array.isArray(service.whats_included) && service.whats_included.length > 0 && (
                <div className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded-lg">
                  <p className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">What's Included:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.whats_included.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  {loading ? 'Creating...' : 'Continue'}
                  <ChevronRight className="ml-2 h-5 w-5" />
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
                  {/* Date Picker with Calendar Popup */}
                  <div className="relative">
                    <Label htmlFor="date" className="mb-2 block">Preferred Date *</Label>
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
                          : 'Select a date'}
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
                                    className={`p-2 rounded-md text-sm transition-colors ${
                                      isPast
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
                    <Label htmlFor="time" className="mb-2 block">Preferred Time *</Label>
                    {loadingSlots ? (
                      <div className="h-11 flex items-center px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-50 dark:bg-zinc-800">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Loading available times...
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
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700'
                                } border-2 ${
                                  isSelected
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
                          Select a date first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {slotsError && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">{slotsError}</p>
                )}

                {/* Add-ons Section */}
                <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Add Extras (Optional)</h3>
                  </div>
                  {loadingAddons ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading add-ons...</p>
                  ) : addons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addons.map((addon) => {
                          const isSelected = formData.selectedAddons.some(a => a.id === addon.id)
                          return (
                            <div
                              key={addon.id}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    selectedAddons: formData.selectedAddons.filter(a => a.id !== addon.id)
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedAddons: [...formData.selectedAddons, addon]
                                  })
                                }
                              }}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
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
                                  className={`ml-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected
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
                          <span className="font-semibold">Selected:</span>{' '}
                          {formData.selectedAddons.map(a => a.name).join(', ')}
                        </p>
                        <p className="text-sm font-semibold text-purple-600 mt-1">
                          Add-ons Total: ${formData.selectedAddons.reduce((sum, a) => sum + Number(a.price), 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto h-12"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                    {loading ? 'Checking...' : 'Continue'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Phone + Notes */}
            {currentStep === 4 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Contact & Notes</h3>
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    We'll use this to contact you about your appointment.
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="w-full sm:w-auto h-12"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                    {loading ? 'Saving...' : 'Continue'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 5: Address + Enhanced Vehicle Details */}
            {currentStep === 5 && (
              <form
                onSubmit={handleStep4}
                className="space-y-6 pb-8 sm:pb-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-lg">Service Location</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="mb-2 block">Street Address *</Label>
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
                      <Label htmlFor="state" className="mb-2 block">State *</Label>
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
                      {business.industry === 'detailing' ? 'Vehicle' : 'Asset'} Information
                    </h3>
                  </div>

                  {business.industry === 'detailing' ? (
                    <div className="space-y-4">
                      {/* Year, Make, Model in responsive grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="vehicle_year" className="mb-2 block">Year *</Label>
                          <select
                            id="vehicle_year"
                            name="asset_year"
                            required
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
                            placeholder="e.g., Civic"
                            className="text-base h-11"
                          />
                        </div>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <Label className="mb-3 block">Color *</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                          {[
                            { name: 'Black', value: 'black', color: '#000000' },
                            { name: 'White', value: 'white', color: '#FFFFFF' },
                            { name: 'Silver', value: 'silver', color: '#C0C0C0' },
                            { name: 'Gray', value: 'gray', color: '#808080' },
                            { name: 'Red', value: 'red', color: '#DC2626' },
                            { name: 'Blue', value: 'blue', color: '#2563EB' },
                            { name: 'Green', value: 'green', color: '#16A34A' },
                            { name: 'Yellow', value: 'yellow', color: '#EAB308' },
                            { name: 'Orange', value: 'orange', color: '#EA580C' },
                            { name: 'Brown', value: 'brown', color: '#92400E' },
                            { name: 'Purple', value: 'purple', color: '#9333EA' },
                            { name: 'Gold', value: 'gold', color: '#CA8A04' },
                          ].map((color) => (
                            <label
                              key={color.value}
                              className="relative cursor-pointer group"
                            >
                              <input
                                type="radio"
                                name="asset_color"
                                value={color.value}
                                required
                                className="peer sr-only"
                              />
                              <div
                                className="h-12 w-full rounded-lg border-2 border-zinc-300 dark:border-zinc-600 peer-checked:border-blue-600 peer-checked:ring-2 peer-checked:ring-blue-500 peer-checked:ring-offset-2 transition-all hover:scale-105"
                                style={{
                                  backgroundColor: color.color,
                                  border: color.value === 'white' ? '2px solid #e5e7eb' : undefined
                                }}
                              />
                              <p className="text-xs text-center mt-1 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                                {color.name}
                              </p>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Vehicle Size */}
                      <div>
                        <Label className="mb-3 block">Vehicle Size *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Sedan / Coupe', value: 'sedan', icon: '🚗' },
                            { label: 'SUV / Crossover', value: 'suv', icon: '🚙' },
                            { label: 'Truck / Van', value: 'truck', icon: '🚚' },
                          ].map((size) => (
                            <label
                              key={size.value}
                              className="relative cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="asset_size"
                                value={size.value}
                                required
                                className="peer sr-only"
                              />
                              <div className="p-4 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950 transition-all hover:border-blue-400 text-center">
                                <div className="text-3xl mb-2">{size.icon}</div>
                                <p className="font-medium text-sm">{size.label}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Condition */}
                      <div>
                        <Label className="mb-3 block">Condition</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Normal', value: 'normal', description: 'Regular maintenance' },
                            { label: 'Very Dirty', value: 'very_dirty', description: 'Needs deep clean' },
                            { label: 'Needs Extra Care', value: 'extra_care', description: 'Heavy soiling/stains' },
                          ].map((condition) => (
                            <label
                              key={condition.value}
                              className="relative cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="asset_condition"
                                value={condition.value}
                                defaultChecked={condition.value === 'normal'}
                                className="peer sr-only"
                              />
                              <div className="p-4 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950 transition-all hover:border-blue-400">
                                <p className="font-medium text-sm mb-1">{condition.label}</p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">{condition.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
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
                    onClick={() => setCurrentStep(4)}
                    className="w-full sm:w-auto h-12 text-base order-2 sm:order-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:flex-1 h-12 text-base order-1 sm:order-2"
                  >
                    {loading ? 'Processing...' : 'Continue to Payment'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky Price Bar (Mobile) */}
      {service.price && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${(
                  (service.price || 0) +
                  formData.selectedAddons.reduce((sum, a) => sum + a.price, 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Step {currentStep} of 4</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((step) => (
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
      )}
    </div>
  )
}
