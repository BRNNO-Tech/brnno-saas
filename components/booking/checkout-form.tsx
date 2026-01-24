'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, Car, Home, Box, Tag, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { INDUSTRY_CONFIGS, DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const MOCK_PAYMENTS = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type Business = {
  id: string
  name: string
  subdomain: string
  stripe_account_id?: string | null
  industry?: string
  booking_banner_url?: string | null
}

export default function CheckoutForm({ business }: { business: Business }) {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<any>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{ percent: number; description?: string } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  
  // Get industry config
  const industry = business.industry || DEFAULT_INDUSTRY
  const industryConfig = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS[DEFAULT_INDUSTRY]
  
  // Select icon based on industry
  let AssetIcon = Car
  if (industry === 'cleaning') AssetIcon = Home
  if (industry === 'hvac') AssetIcon = Box

  useEffect(() => {
    const data = sessionStorage.getItem('bookingData')
    if (!data) {
      window.location.href = `/${business.subdomain}`
      return
    }
    const parsed = JSON.parse(data)
    setBookingData(parsed)
    
    // Restore discount code if it was applied
    if (parsed.discountCode && parsed.discountPercent) {
      setDiscountCode(parsed.discountCode)
      setDiscountApplied({
        percent: parsed.discountPercent,
        description: parsed.discountDescription
      })
    }
    
    // Debug: Log payment mode
    console.log('[CheckoutForm] Payment mode check:')
    console.log('  - MOCK_PAYMENTS:', MOCK_PAYMENTS)
    console.log('  - NEXT_PUBLIC_MOCK_PAYMENTS env:', process.env.NEXT_PUBLIC_MOCK_PAYMENTS)
    console.log('  - Has Stripe account:', !!business.stripe_account_id)
    console.log('  - Stripe account ID:', business.stripe_account_id)
  }, [business.subdomain, business.stripe_account_id])

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return
    
    setApplyingDiscount(true)
    setDiscountError(null)
    
    try {
      const response = await fetch('/api/validate-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          code: discountCode.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setDiscountApplied({
          percent: data.discountPercent,
          description: data.description
        })
        // Update bookingData with discount
        setBookingData((prev: any) => ({
          ...prev,
          discountCode: discountCode.trim().toUpperCase(),
          discountPercent: data.discountPercent,
          discountDescription: data.description
        }))
        // Update sessionStorage
        const updated = {
          ...bookingData,
          discountCode: discountCode.trim().toUpperCase(),
          discountPercent: data.discountPercent,
          discountDescription: data.description
        }
        sessionStorage.setItem('bookingData', JSON.stringify(updated))
      } else {
        const error = await response.json()
        setDiscountError(error.error || 'Invalid discount code')
        setDiscountApplied(null)
      }
    } catch (error) {
      setDiscountError('Failed to validate discount code')
      setDiscountApplied(null)
    } finally {
      setApplyingDiscount(false)
    }
  }

  function handleRemoveDiscount() {
    setDiscountCode('')
    setDiscountApplied(null)
    setDiscountError(null)
    const updated = { ...bookingData }
    delete updated.discountCode
    delete updated.discountPercent
    delete updated.discountDescription
    setBookingData(updated)
    sessionStorage.setItem('bookingData', JSON.stringify(updated))
  }

  // Calculate discounted price
  const originalTotal = bookingData?.totalPrice || bookingData?.service?.price || 0
  const discountAmount = discountApplied 
    ? (originalTotal * discountApplied.percent) / 100 
    : 0
  const finalTotal = Math.max(0, originalTotal - discountAmount)

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading checkout...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* Booking Banner */}
      {business.booking_banner_url && (
        <div className="w-full">
          {/* Banner Image */}
          <div className="relative">
            <img 
              src={business.booking_banner_url} 
              alt={`${business.name} banner`}
              className="w-full h-48 sm:h-64 md:h-80 object-cover"
            />
            
            {/* Desktop: Glassmorphic overlay on banner */}
            <header className="hidden sm:block absolute bottom-0 left-0 right-0 backdrop-blur-xl border-t border-white/30 dark:border-zinc-700/30 shadow-lg">
              <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-t-2xl p-4 sm:p-6 border-t border-l border-r border-white/30 dark:border-zinc-700/30 shadow-xl">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 text-sm sm:text-base"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to booking
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold">Checkout</h1>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                    Complete your booking with {business.name}
                  </p>
                </div>
              </div>
            </header>
          </div>
          
          {/* Mobile: Checkout info below banner */}
          <div className="block sm:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 text-sm p-2 -m-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to booking
              </button>
              <h1 className="text-2xl font-bold mb-2">Checkout</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Complete your booking with {business.name}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header - No Banner */}
      {!business.booking_banner_url && (
        <header className="bg-white/80 dark:bg-zinc-900/80 border-b backdrop-blur-xl border-white/20 dark:border-zinc-700/50 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to booking
            </button>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Complete your booking with {business.name}
            </p>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Service</p>
                      <p className="font-semibold">{bookingData.service.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Customer</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-zinc-400" />
                          {bookingData.customer.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-zinc-400" />
                          {bookingData.customer.email}
                        </div>
                        {bookingData.customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            {bookingData.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {bookingData.assetDetails && (
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{industryConfig.assetName} Details</p>
                        <div className="space-y-1 text-sm">
                          {Object.entries(bookingData.assetDetails).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              {/* Simple capitalization of key */}
                              <span className="text-zinc-500 capitalize">{key}:</span>
                              <span>{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Appointment</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          {new Date(bookingData.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          {bookingData.scheduledTime}
                        </div>
                      </div>
                    </div>

                    {bookingData.notes && (
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Notes</p>
                        <p className="text-sm">{bookingData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  {/* Discount Code Input */}
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="discountCode" className="text-sm font-medium">Discount Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discountCode"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1"
                        disabled={!!discountApplied}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !discountApplied && discountCode.trim()) {
                            e.preventDefault()
                            handleApplyDiscount()
                          }
                        }}
                      />
                      {!discountApplied ? (
                        <Button
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || !discountCode.trim()}
                          variant="outline"
                          size="sm"
                        >
                          {applyingDiscount ? 'Applying...' : 'Apply'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleRemoveDiscount}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {discountError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{discountError}</p>
                    )}
                    {discountApplied && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <Tag className="h-4 w-4" />
                        <span>
                          {discountApplied.percent}% discount applied{discountApplied.description && `: ${discountApplied.description}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show breakdown if there are addons, variable pricing, or condition fee */}
                  {(bookingData.addons?.length > 0 || bookingData.vehicleSize || bookingData.breakdown?.conditionFee) && (
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Service</span>
                        <span>${(bookingData.breakdown?.base || bookingData.service.base_price || bookingData.service.price || 0).toFixed(2)}</span>
                      </div>
                      {bookingData.breakdown?.sizeFee !== undefined && bookingData.breakdown.sizeFee > 0 && (
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>Vehicle ({bookingData.vehicleSize})</span>
                          <span>+${bookingData.breakdown.sizeFee.toFixed(2)}</span>
                        </div>
                      )}
                      {bookingData.breakdown?.conditionFee !== undefined && bookingData.breakdown.conditionFee > 0 && (
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span>Condition Fee</span>
                          <span>+${bookingData.breakdown.conditionFee.toFixed(2)}</span>
                        </div>
                      )}
                      {bookingData.addons?.map((addon: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-zinc-500 dark:text-zinc-400">
                          <span>{addon.name}</span>
                          <span>+${(addon.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      {discountApplied && (
                        <div className="flex justify-between text-green-600 dark:text-green-400 pt-2 border-t">
                          <span>Discount ({discountApplied.percent}%)</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {discountApplied && (!bookingData.addons?.length && !bookingData.vehicleSize && !bookingData.breakdown?.conditionFee) && (
                    <div className="mb-4 text-sm">
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount ({discountApplied.percent}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment */}
          <div className="lg:col-span-2">
            {/* Show Stripe if connected, otherwise show invoice-style checkout (no payment option) */}
            {business.stripe_account_id ? (
              <RealPayment business={business} bookingData={bookingData} />
            ) : (
              <NoPaymentOption business={business} bookingData={bookingData} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function MockPayment({ business, bookingData }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMockPayment() {
    setLoading(true)

    const response = await fetch('/api/create-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })

    if (response.ok) {
      sessionStorage.removeItem('bookingData')
      router.push(`/${business.subdomain}/book/confirmation?success=true`)
    } else {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      alert(`Failed to create booking: ${error.error || 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-6">
            <p className="font-semibold mb-2">🧪 Mock Payment Mode (Development)</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Real payments are disabled. Click below to simulate a successful booking.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">What happens when you click:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-zinc-700 dark:text-zinc-300">
                <li>Creates client in database</li>
                <li>Creates scheduled job with asset details</li>
                <li>Creates invoice (unpaid)</li>
                <li>Sends you to confirmation page</li>
              </ul>
            </div>

            <Button
              onClick={handleMockPayment}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Creating booking...' : `✅ Complete Booking ($${finalTotal.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RealPayment({ business, bookingData }: any) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const originalTotal = bookingData.totalPrice || bookingData.service.price || 0
        const discountAmount = bookingData.discountPercent 
          ? (originalTotal * bookingData.discountPercent) / 100 
          : 0
        const finalTotal = Math.max(0, originalTotal - discountAmount)
        const amount = Math.round(finalTotal * 100) // Convert to cents

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            stripeAccountId: business.stripe_account_id,
            businessId: business.id,
            bookingData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment intent')
        }

        const { clientSecret: secret } = await response.json()
        setClientSecret(secret)
      } catch (err: any) {
        console.error('Error creating payment intent:', err)
        setError(err.message || 'Failed to initialize payment')
      } finally {
        setLoading(false)
      }
    }

    // Check if we should use Stripe or mock payments
    const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'
    
    if (mockMode) {
      // In mock mode, don't create payment intent - will use MockPayment component
      setLoading(false)
    } else if (business.stripe_account_id) {
      createPaymentIntent()
    } else {
      // No Stripe connected and not in mock mode - show message but allow booking without payment
      setError('Payment not available - booking will be created without payment')
      setLoading(false)
    }
  }, [business, bookingData])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-zinc-600 dark:text-zinc-400">Loading payment form...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !clientSecret) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-6">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">Payment Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{error || 'Failed to initialize payment'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-6">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Configuration Error</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Stripe publishable key is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm business={business} bookingData={bookingData} />
    </Elements>
  )
}

function StripePaymentForm({ business, bookingData }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate discounted price
  const originalTotal = bookingData?.totalPrice || bookingData?.service?.price || 0
  const discountAmount = bookingData?.discountPercent 
    ? (originalTotal * bookingData.discountPercent) / 100 
    : 0
  const finalTotal = Math.max(0, originalTotal - discountAmount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Confirm payment
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment form validation failed')
        setLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${business.subdomain}/book/confirmation?success=true`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Payment succeeded - create booking
      console.log('[StripePaymentForm] Payment confirmed, creating booking...')
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[StripePaymentForm] Booking created successfully:', result)
        sessionStorage.removeItem('bookingData')
        router.push(`/${business.subdomain}/book/confirmation?success=true`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[StripePaymentForm] Booking creation failed:', errorData)
        setError(errorData.error || 'Failed to create booking')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An error occurred during payment')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg mb-4">Payment Details</h2>
            <PaymentElement />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
          </Button>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Your payment is secure and encrypted
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function NoPaymentOption({ business, bookingData }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate discounted price
  const originalTotal = bookingData?.totalPrice || bookingData?.service?.price || 0
  const discountAmount = bookingData?.discountPercent 
    ? (originalTotal * bookingData.discountPercent) / 100 
    : 0
  const finalTotal = Math.max(0, originalTotal - discountAmount)

  // Calculate appointment date/time display
  const appointmentDate = new Date(`${bookingData.scheduledDate}T${bookingData.scheduledTime}`)
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  
  // Calculate end time based on duration
  const duration = bookingData.service.duration_minutes || 60
  const endTime = new Date(appointmentDate.getTime() + duration * 60 * 1000)
  const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  async function handleBookingWithoutPayment() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
        }),
      })

      if (response.ok) {
        sessionStorage.removeItem('bookingData')
        router.push(`/${business.subdomain}/book/confirmation?success=true`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || 'Failed to create booking')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'Failed to create booking')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Contact Information Section */}
          <div>
            <h2 className="font-semibold text-lg mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    First Name
                  </label>
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm">
                    {bookingData.customer.name.split(' ')[0] || bookingData.customer.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Last Name
                  </label>
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm">
                    {bookingData.customer.name.split(' ').slice(1).join(' ') || '-'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Email
                </label>
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm">
                  {bookingData.customer.email}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Phone Number
                </label>
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm">
                  {bookingData.customer.phone || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Summary */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-lg mb-4">Appointment Summary</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formattedTime} - {formattedEndTime}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                    Est. due at appointment: ${finalTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{business.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {bookingData.service.name}
                  </p>
                  {bookingData.service.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                      {bookingData.service.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-lg mb-4">Cost Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Service</span>
                <span className="font-medium">${(bookingData.breakdown?.base || bookingData.service.base_price || bookingData.service.price || 0).toFixed(2)}</span>
              </div>
              {bookingData.breakdown?.sizeFee !== undefined && bookingData.breakdown.sizeFee > 0 && (
                <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                  <span>Vehicle ({bookingData.vehicleSize})</span>
                  <span>+${bookingData.breakdown.sizeFee.toFixed(2)}</span>
                </div>
              )}
              {bookingData.breakdown?.conditionFee !== undefined && bookingData.breakdown.conditionFee > 0 && (
                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span>Condition Fee</span>
                  <span>+${bookingData.breakdown.conditionFee.toFixed(2)}</span>
                </div>
              )}
              {bookingData.addons?.map((addon: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{addon.name}</span>
                  <span>+${(addon.price || 0).toFixed(2)}</span>
                </div>
              ))}
              {bookingData.discountPercent && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount ({bookingData.discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Taxes</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600 dark:text-green-400">
                  ${finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-lg mb-4">Payment Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Due today</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Due at appointment</span>
                <span className="font-medium">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
              Payment will be collected at the time of service. The business will contact you to confirm your appointment.
            </p>
          </div>

          {/* Notes Section */}
          {bookingData.notes && (
            <div className="border-t pt-6">
              <h2 className="font-semibold text-lg mb-2">Appointment Notes</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{bookingData.notes}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Booking Button */}
          <div className="border-t pt-6">
            <Button
              onClick={handleBookingWithoutPayment}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Creating booking...' : 'Book Appointment'}
            </Button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-3">
              By booking, you agree to the cancellation policy. The business will contact you to confirm.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
