'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, DollarSign, User, X, ChevronRight } from 'lucide-react'
export type CustomerBookingRow = {
  id: string
  created_at: string
  service_type: string | null
  scheduled_date: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  status: string
  estimated_cost: number | null
  asset_details?: { make?: string; model?: string; year?: string; color?: string } | null
  client: { name: string | null; phone: string | null; email: string | null } | null
  assignments: Array<{
    id: string
    team_member: { id: string; name: string | null; phone: string | null } | null
  }> | null
}

type Translations = {
  myBookings?: string
  enterEmailToViewBookings?: string
  viewMyBookings?: string
  signOut?: string
  noBookingsYet?: string
  readyToBook?: string
  bookAgain?: string
  viewDetails?: string
  bookingDetails?: string
  location?: string
  scheduledTime?: string
  cost?: string
  yourAssignedTeamMember?: string
  bookedOn?: string
  statusScheduled?: string
  statusInProgress?: string
  statusCompleted?: string
  statusCancelled?: string
  returnToServices?: string
}

export default function CustomerDashboard({
  businessName,
  subdomain,
  email,
  bookings,
  lang,
  t = {},
  isLoggedIn = false
}: {
  businessName: string
  subdomain: string
  email?: string
  bookings: CustomerBookingRow[]
  lang: 'en' | 'es'
  t?: Translations
  isLoggedIn?: boolean
}) {
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<CustomerBookingRow | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const basePath = `/${subdomain}/book${lang === 'es' ? '?lang=es' : ''}`
  const dashboardPath = `/${subdomain}/dashboard${lang === 'es' ? '?lang=es' : ''}`

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push(dashboardPath)
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    }
    const label =
      status === 'scheduled'
        ? t.statusScheduled ?? 'Scheduled'
        : status === 'in_progress'
          ? t.statusInProgress ?? 'In progress'
          : status === 'completed'
            ? t.statusCompleted ?? 'Completed'
            : status === 'cancelled'
              ? t.statusCancelled ?? 'Cancelled'
              : status
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] ?? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}
      >
        {label}
      </span>
    )
  }

  function formatLocation(booking: CustomerBookingRow) {
    const parts = [booking.address, booking.city, booking.state, booking.zip].filter(Boolean)
    return parts.length ? parts.join(', ') : '—'
  }

  function formatCost(value: number | null) {
    if (value == null) return '—'
    const dollars = value >= 1000 ? value / 100 : value
    return `$${dollars.toFixed(2)}`
  }

  const firstAssigned = (b: CustomerBookingRow) =>
    b.assignments?.[0]?.team_member ?? null

  // No bookings
  if (bookings.length === 0) {
    return (
      <>
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.myBookings ?? 'My Account'}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isLoggedIn && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={signingOut}>
                    {t.signOut ?? 'Log out'}
                  </Button>
                  <Link href={`/${subdomain}/dashboard/vehicles${lang === 'es' ? '?lang=es' : ''}`}>
                    <Button variant="outline" size="sm">Vehicles</Button>
                  </Link>
                  <Link href={`/${subdomain}/dashboard/addresses${lang === 'es' ? '?lang=es' : ''}`}>
                    <Button variant="outline" size="sm">Addresses</Button>
                  </Link>
                </>
              )}
              <Link href={basePath}>
                <Button variant="outline">{t.bookAgain ?? 'Book Again'}</Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow p-12 text-center">
            <div className="text-5xl mb-4">🚗</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              {t.noBookingsYet ?? 'No bookings yet'}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{t.readyToBook ?? 'Ready to book?'}</p>
            <Link href={basePath}>
              <Button>{t.bookAgain ?? 'Book Again'}</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  // List + modal
  return (
    <>
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.myBookings ?? 'My Account'}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isLoggedIn && (
              <>
                <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={signingOut}>
                  {t.signOut ?? 'Log out'}
                </Button>
                <Link href={`/${subdomain}/dashboard/vehicles${lang === 'es' ? '?lang=es' : ''}`}>
                  <Button variant="outline" size="sm">Vehicles</Button>
                </Link>
                <Link href={`/${subdomain}/dashboard/addresses${lang === 'es' ? '?lang=es' : ''}`}>
                  <Button variant="outline" size="sm">Addresses</Button>
                </Link>
              </>
            )}
            <Link href={basePath}>
              <Button variant="outline">{t.bookAgain ?? 'Book Again'}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const teamMember = firstAssigned(booking)
            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {booking.service_type || 'Service'}
                    </h3>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{formatLocation(booking)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {booking.scheduled_date
                        ? new Date(booking.scheduled_date).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {formatCost(booking.estimated_cost)}
                    </span>
                  </div>
                  {(booking.asset_details?.make || booking.asset_details?.model) && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      🚗 {[booking.asset_details?.year, booking.asset_details?.make, booking.asset_details?.model].filter(Boolean).join(' ')}
                      {booking.asset_details?.color && ` • ${booking.asset_details.color}`}
                    </div>
                  )}
                  {teamMember && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">{t.yourAssignedTeamMember ?? 'Your assigned team member'}</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{teamMember.name ?? '—'}</p>
                      {teamMember.phone && (
                        <a
                          href={`tel:${teamMember.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {teamMember.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedBooking(booking)
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                  >
                    {t.viewDetails ?? 'View Details'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t.bookingDetails ?? 'Booking Details'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-1"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedBooking.status)}
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {selectedBooking.service_type || 'Service'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 mb-1">{t.location ?? 'Location'}</h3>
                <p className="text-zinc-900 dark:text-white">{formatLocation(selectedBooking)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 mb-1">{t.scheduledTime ?? 'Scheduled Time'}</h3>
                <p className="text-zinc-900 dark:text-white">
                  {selectedBooking.scheduled_date
                    ? new Date(selectedBooking.scheduled_date).toLocaleString('en-US', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 mb-1">{t.cost ?? 'Cost'}</h3>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {formatCost(selectedBooking.estimated_cost)}
                </p>
              </div>
              {(selectedBooking.asset_details?.make || selectedBooking.asset_details?.model) && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-1">Vehicle</h3>
                  <p className="text-zinc-900 dark:text-white">
                    🚗 {[selectedBooking.asset_details?.year, selectedBooking.asset_details?.make, selectedBooking.asset_details?.model].filter(Boolean).join(' ')}
                    {selectedBooking.asset_details?.color && ` • ${selectedBooking.asset_details.color}`}
                  </p>
                </div>
              )}
              {firstAssigned(selectedBooking) && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-2">
                    {t.yourAssignedTeamMember ?? 'Your assigned team member'}
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {firstAssigned(selectedBooking)!.name ?? '—'}
                    </p>
                    {firstAssigned(selectedBooking)!.phone && (
                      <a
                        href={`tel:${firstAssigned(selectedBooking)!.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {firstAssigned(selectedBooking)!.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">
                  {t.bookedOn ?? 'Booked on'}{' '}
                  {new Date(selectedBooking.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
