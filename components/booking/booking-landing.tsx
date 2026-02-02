'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, MapPin, Star, Clock, DollarSign, Check } from 'lucide-react'
import { getStartingPrice, isVariablePricing } from '@/lib/utils/service-pricing'
import { getFeatureLabel } from '@/lib/utils/feature-labels'
import Image from 'next/image'
import { getCustomerBookingTranslations, type CustomerBookingLang } from '@/lib/translations/customer-booking'
import { BookingLanguageSwitcher } from './booking-language-switcher'

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
  booking_banner_url?: string | null
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  base_price?: number | null
  duration_minutes: number | null
  base_duration?: number | null
  estimated_duration?: number | null
  image_url?: string | null
  icon?: string | null
  is_popular?: boolean | null
  whats_included?: string[] | null
}

export default function BookingLanding({
  business,
  services,
  lang = 'en'
}: {
  business: Business
  services: Service[]
  lang?: 'en' | 'es'
}) {
  const t = getCustomerBookingTranslations((lang ?? 'en') as CustomerBookingLang)
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* Language switcher - visible on all viewports */}
      <div className="fixed top-4 right-4 z-50">
        <BookingLanguageSwitcher subdomain={business.subdomain} path="" query={{}} lang={lang ?? 'en'} />
      </div>
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
              <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-t-2xl p-4 sm:p-6 border-t border-l border-r border-white/30 dark:border-zinc-700/30 shadow-xl">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
                    {business.name}
                  </h1>
                  {business.description && (
                    <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400">
                      {business.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm">
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
              </div>
            </header>
          </div>

          {/* Mobile: Business info below banner */}
          <div className="block sm:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">
                {business.name}
              </h1>
              {business.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                  {business.description}
                </p>
              )}

              {/* Contact Info - Mobile */}
              <div className="flex flex-col gap-3 text-sm">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 -m-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 -m-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Mail className="h-4 w-4" />
                    {business.email}
                  </a>
                )}
                {business.city && business.state && (
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 p-2 -m-2">
                    <MapPin className="h-4 w-4" />
                    {business.city}, {business.state}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - No Banner */}
      {!business.booking_banner_url && (
        <header className="bg-white/80 dark:bg-zinc-900/80 border-b backdrop-blur-xl border-white/20 dark:border-zinc-700/50 shadow-lg">
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
      )}

      {/* Services */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
            {t.ourServices}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t.selectServiceSubtitle}
          </p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {t.noServicesAvailable}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              // Calculate display values
              const displayPrice = service.base_price ?? service.price ?? 0
              const durationMinutes = service.base_duration || service.estimated_duration || service.duration_minutes || 0
              const durationHours = durationMinutes / 60
              const price = getStartingPrice(service as any)
              const isVariable = isVariablePricing(service as any)

              return (
                <Card
                  key={service.id}
                  className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                >
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
                      {service.is_popular && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600">
                          <Star className="h-3 w-3 mr-1" />
                          {t.popular}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Service Content */}
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div>
                      <h3 className="text-xl font-bold">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Duration */}
                    <div className="flex items-center gap-4 text-sm">
                      {displayPrice > 0 && (service as any)?.show_price !== false && (
                        <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {isVariable ? 'Starting at ' : ''}${price.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {durationMinutes > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {durationHours % 1 === 0
                              ? durationHours.toFixed(0)
                              : durationHours.toFixed(1)
                            } {durationHours === 1 ? t.hour : t.hours}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* What's Included */}
                    {service.whats_included && Array.isArray(service.whats_included) && service.whats_included.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          What's Included
                        </p>
                        <ul className="space-y-1">
                          {service.whats_included.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{getFeatureLabel(item)}</span>
                            </li>
                          ))}
                          {service.whats_included.length > 3 && (
                            <li className="text-xs text-muted-foreground pl-6">
                              +{service.whats_included.length - 3} {t.more}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Book Button */}
                    <Link href={`/${business.subdomain}/book?service=${service.id}${lang === 'es' ? '&lang=es' : ''}`} className="block">
                      <Button className="w-full" size="lg">
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>{t.poweredBy}</p>
        </div>
      </footer>
    </div>
  )
}
