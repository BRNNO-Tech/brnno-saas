'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { getAvailableTimeSlots, checkTimeSlotAvailability } from '@/lib/actions/schedule'
import AssetDetailsForm from './asset-details-form'
import { DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'

type Business = {
  id: string
  name: string
  subdomain: string
  stripe_account_id?: string | null
  industry?: string // Added industry
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
}

export default function BookingForm({
  business,
  service
}: {
  business: Business
  service: Service
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // Get minimum time (current time if today, or 00:00 if future date)
  const now = new Date()
  const currentHour = now.getHours().toString().padStart(2, '0')
  const currentMinute = now.getMinutes().toString().padStart(2, '0')
  const minTime = `${currentHour}:${currentMinute}`

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
          setSlotsError('No available time slots for this date. Please try another date or contact the business directly.')
        }
      } catch (err) {
        console.error('Error loading available slots:', err)
        setAvailableSlots([])
        setSlotsError('Unable to load available times. Please try again or contact the business directly.')
      } finally {
        setLoadingSlots(false)
      }
    }

    loadSlots()
  }, [selectedDate, business.id, service.duration_minutes])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const email = formData.get('email') as string
      const phone = formData.get('phone') as string
      const date = formData.get('date') as string
      // Get time from either dropdown or custom input
      const time = (formData.get('time') as string) || (formData.get('time-custom') as string)
      const notes = formData.get('notes') as string
      const address = formData.get('address') as string
      const city = formData.get('city') as string
      const state = formData.get('state') as string
      const zip = formData.get('zip') as string

      // Extract asset details (all fields starting with asset_)
      const assetDetails: Record<string, any> = {}
      for (const [key, value] of Array.from(formData.entries())) {
        if (key.startsWith('asset_')) {
          const fieldName = key.replace('asset_', '')
          assetDetails[fieldName] = value
        }
      }

      // Validation
      if (!name || name.trim() === '') {
        setError('Name is required')
        setLoading(false)
        return
      }

      if (!email || email.trim() === '') {
        setError('Email is required')
        setLoading(false)
        return
      }

      if (!date || !time) {
        setError('Date and time are required')
        setLoading(false)
        return
      }

      // Combine date and time
      const dateTime = new Date(`${date}T${time}`)

      // Check if date/time is in the past
      if (dateTime < new Date()) {
        setError('Please select a date and time in the future')
        setLoading(false)
        return
      }

      // Check if time slot is available
      const duration = service.duration_minutes || 60
      const isAvailable = await checkTimeSlotAvailability(business.id, dateTime.toISOString(), duration)
      if (!isAvailable) {
        setError('This time slot is no longer available. Please select another time.')
        setLoading(false)
        return
      }

      // Check if business has Stripe connected (or if mock mode is enabled)
      const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

      if (!mockMode && !business.stripe_account_id) {
        // No payment setup - create booking request without payment
        alert(`Booking request submitted!\n\nService: ${service.name}\nDate: ${dateTime.toLocaleString()}\n\nWe'll contact you soon to confirm.`)
        router.push(`/${business.subdomain}`)
        return
      }

      // Save booking data to sessionStorage and redirect to checkout
      const bookingData = {
        businessId: business.id,
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price || 0,
          duration_minutes: service.duration_minutes,
        },
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        },
        scheduledDate: date,
        scheduledTime: time,
        notes: notes.trim() || null,
        assetDetails: Object.keys(assetDetails).length > 0 ? assetDetails : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim()
      }

      sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
      router.push(`/${business.subdomain}/book/checkout`)
    } catch (err) {
      console.error('Error submitting booking:', err)
      setError('Failed to submit booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Back Button */}
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
                    <span>~{service.duration_minutes} minutes</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Service Location
                </h3>
                
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    required
                    placeholder="123 Main St"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      required
                      placeholder="Salt Lake City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      required
                      placeholder="UT"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      name="zip"
                      required
                      placeholder="84043"
                    />
                  </div>
                </div>
              </div>

              {/* Asset Details (Dynamic based on industry) */}
              <AssetDetailsForm 
                industry={business.industry || DEFAULT_INDUSTRY} 
                onChange={() => {}} // No-op, we gather via formData
              />

              {/* Date & Time */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Preferred Date *
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      min={today}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        // Reset time when date changes
                        const timeInput = document.getElementById('time') as HTMLInputElement
                        if (timeInput) timeInput.value = ''
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Preferred Time *
                    </Label>
                    {loadingSlots ? (
                      <div className="space-y-2">
                        <div className="flex h-9 items-center text-sm text-zinc-600 dark:text-zinc-400">
                          Loading available times...
                        </div>
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          required
                          className="h-9"
                        />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          id="time"
                          name="time"
                          required
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Or enter a custom time:
                        </p>
                        <Input
                          id="time-custom"
                          name="time-custom"
                          type="time"
                          className="h-9"
                        />
                      </div>
                    ) : selectedDate ? (
                      <div className="space-y-2">
                        {slotsError && (
                          <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                            {slotsError}
                          </div>
                        )}
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          required
                          className="h-9"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Enter your preferred time. The business will confirm availability.
                        </p>
                      </div>
                    ) : (
                      <Input
                        id="time"
                        name="time"
                        type="time"
                        required
                        disabled
                        placeholder="Select a date first"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Special Requests or Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special instructions or requests..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${business.subdomain}`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
