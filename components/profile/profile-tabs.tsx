'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, DollarSign, Star } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

type BusinessHours = Record<string, { open?: string; close?: string; closed?: boolean } | null>

type ReviewItem = {
  id: string
  rating: number
  comment: string | null
  customer_name: string | null
  created_at: string
}

function formatTime24to12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (h === 0) return `12:${m.toString().padStart(2, '0')} AM`
  if (h === 12) return `12:${m.toString().padStart(2, '0')} PM`
  return `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

interface ProfileTabsProps {
  profile: any
  services: any[]
  reviews: ReviewItem[]
  subdomain: string
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  buttonClass: string
  lang?: 'en' | 'es'
  businessHours?: BusinessHours | null
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function ProfileTabs({
  profile,
  services,
  reviews = [],
  subdomain,
  theme,
  buttonClass,
  lang = 'en',
  businessHours = null,
}: ProfileTabsProps) {
  const hasStory = !!(profile?.owner_story || profile?.owner_photo_url)
  const hasReviews = reviews.length >= 1
  const [activeTab, setActiveTab] = useState<'portfolio' | 'services' | 'about' | 'story' | 'reviews'>('portfolio')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const tabs = [
    { id: 'portfolio' as const, label: 'Portfolio' },
    { id: 'services' as const, label: 'Services' },
    { id: 'about' as const, label: 'About' },
    ...(hasStory ? [{ id: 'story' as const, label: 'Our Story' }] : []),
    ...(hasReviews ? [{ id: 'reviews' as const, label: 'Reviews' }] : []),
  ]

  const lightboxSlides =
    profile?.portfolio_photos?.map((photo: string) => ({
      src: photo,
    })) || []

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleLightboxClose = () => {
    setLightboxOpen(false)
    setTimeout(() => {
      setLightboxIndex(0)
    }, 100)
  }

  return (
    <div className="mt-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-t-2xl shadow-sm sticky top-0 z-10 border border-zinc-200 border-b-0">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm sm:text-base font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? 'text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-2xl shadow-sm p-4 sm:p-6 border border-zinc-200 border-t-0 text-zinc-700">
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            {profile?.portfolio_photos && profile.portfolio_photos.length > 0 ? (
              <>
                <div className="portfolio-grid grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {profile.portfolio_photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePhotoClick(index)}
                      className="aspect-square overflow-hidden rounded-lg bg-zinc-100 hover:opacity-90 transition-opacity relative group"
                    >
                      <img
                        src={photo}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-all flex items-center justify-center group-hover:bg-black/10" aria-hidden>
                        <svg
                          className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Force portfolio images to be visible */}
                <style jsx>{`
                  .portfolio-grid img {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                  }
                `}</style>

                <Lightbox
                  key={lightboxOpen ? 'open' : 'closed'}
                  open={lightboxOpen}
                  close={handleLightboxClose}
                  index={lightboxIndex}
                  slides={lightboxSlides}
                  styles={{
                    container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
                  }}
                />
              </>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>No portfolio photos yet</p>
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {services.length > 0 ? (
              services.map((service) => {
                const price = service.base_price ?? service.price ?? 0
                const duration =
                  service.duration_minutes ??
                  service.base_duration ??
                  service.estimated_duration ??
                  service.duration ??
                  null
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 mb-1">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-zinc-600 mb-2 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        {duration != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration} min
                          </span>
                        )}
                        {price > 0 && (service as any)?.show_pricing !== false && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${Number(price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/${subdomain}/book?service=${service.id}${lang === 'es' ? '&lang=es' : ''}`} className="shrink-0 ml-4">
                      <button
                        type="button"
                        className={`px-4 py-2 text-white font-semibold text-sm ${buttonClass}`}
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Book
                      </button>
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>Services coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {businessHours && Object.keys(businessHours).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-zinc-900">
                  <Clock className="h-5 w-5" style={{ color: theme.primaryColor }} />
                  Hours
                </h3>
                <ul className="space-y-2 text-sm text-zinc-700">
                  {(Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>).map((day) => {
                    const value = businessHours[day] ?? null
                    return (
                      <li key={day} className="flex justify-between gap-4">
                        <span className="text-zinc-500">{DAY_LABELS[day]}</span>
                        <span>
                          {!value || value.closed
                            ? 'Closed'
                            : value.open && value.close
                              ? `${formatTime24to12(value.open)} – ${formatTime24to12(value.close)}`
                              : '—'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {profile?.bio ? (
              <div className="prose prose-sm sm:prose max-w-none prose-zinc">
                <h3 className="font-semibold mb-2 text-zinc-900">About</h3>
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            ) : !businessHours || Object.keys(businessHours).length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No bio added yet</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Our Story Tab */}
        {activeTab === 'story' && hasStory && (
          <div className="flex gap-4 sm:gap-5 items-start">
            {profile?.owner_photo_url && (
              <div className="shrink-0">
                <img
                  src={profile.owner_photo_url}
                  alt={profile?.owner_name || 'Owner'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-200/60 shadow-inner"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {profile?.owner_name && (
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                  {profile.owner_name}
                </h3>
              )}
              {profile?.years_experience != null && profile.years_experience > 0 && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-2">
                  {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'} experience
                </span>
              )}
              {profile?.owner_story && (
                <p className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {profile.owner_story}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && hasReviews && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-1" style={{ color: theme.primaryColor }}>
                <Star className="w-5 h-5" fill="currentColor" />
                <span className="text-lg font-bold text-zinc-900">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-zinc-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5" style={{ color: theme.primaryColor }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="w-4 h-4"
                          fill={i <= review.rating ? 'currentColor' : 'transparent'}
                        />
                      ))}
                    </div>
                    {review.customer_name && (
                      <span className="text-sm font-medium text-zinc-700">{review.customer_name}</span>
                    )}
                    <span className="text-xs text-zinc-400 ml-auto">
                      {new Date(review.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
