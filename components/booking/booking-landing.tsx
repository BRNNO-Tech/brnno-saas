'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Mail, MapPin } from 'lucide-react'

type Business = {
  id: string
  name: string
  subdomain: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  description: string | null
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
}

export default function BookingLanding({
  business,
  services
}: {
  business: Business
  services: Service[]
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
            {business.name}
          </h1>
          {business.description && (
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {business.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {business.phone}
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {business.email}
              </a>
            )}
            {business.city && business.state && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <MapPin className="h-4 w-4" />
                {business.city}, {business.state}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Services */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
            Our Services
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Select a service to book your appointment
          </p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                No services available yet. Please check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      {service.price && (
                        <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                          ${service.price.toFixed(2)}
                        </p>
                      )}
                      {service.duration_minutes && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          ~
                          {service.duration_minutes % 60 === 0
                            ? `${service.duration_minutes / 60} ${service.duration_minutes / 60 === 1 ? 'hour' : 'hours'}`
                            : `${(service.duration_minutes / 60).toFixed(1)} hours`}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link href={`/${business.subdomain}/book?service=${service.id}`}>
                    <Button className="w-full" size="lg">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Powered by BRNNO</p>
        </div>
      </footer>
    </div>
  )
}
