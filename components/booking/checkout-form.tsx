'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, Car, Home, Box } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { INDUSTRY_CONFIGS, DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'

const MOCK_PAYMENTS = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

type Business = {
  id: string
  name: string
  subdomain: string
  stripe_account_id?: string | null
  industry?: string
}

export default function CheckoutForm({ business }: { business: Business }) {
  const [bookingData, setBookingData] = useState<any>(null)
  
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
    setBookingData(JSON.parse(data))
  }, [business.subdomain])

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading checkout...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href={`/${business.subdomain}/book?service=${bookingData.service.id}`}
            className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Complete your booking with {business.name}
          </p>
        </div>
      </header>

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
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">
                      ${bookingData.service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment */}
          <div className="lg:col-span-2">
            {MOCK_PAYMENTS ? (
              <MockPayment business={business} bookingData={bookingData} />
            ) : (
              <RealPayment business={business} bookingData={bookingData} />
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
              {loading ? 'Creating booking...' : `✅ Complete Booking ($${bookingData.service.price.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RealPayment({ business, bookingData }: any) {
  return (
    <Card>
      <CardContent className="p-8">
        <p className="font-semibold mb-2">Real Stripe Payment</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Set NEXT_PUBLIC_MOCK_PAYMENTS=true in .env.local to test without Stripe
        </p>
      </CardContent>
    </Card>
  )
}
