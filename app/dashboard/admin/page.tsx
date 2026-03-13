'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Search, Check, X, RefreshCw, Building2 } from 'lucide-react'
import { isAdminEmail } from '@/lib/permissions'

type Auth0Signup = {
  id: string
  name: string
  email?: string
  picture?: string
  createdAt?: string
  provider: string
}

type DemoBooking = {
  id: string
  name: string
  email: string
  message?: string | null
  created_at: string
}

type Business = {
  id: string
  name: string
  email: string | null
  owner_id: string
  billing_plan: string | null
  billing_interval: string | null
  subscription_plan: string | null
  subscription_status: string | null
  modules: Record<string, unknown> | null
  stripe_subscription_id: string | null
  created_at: string
}

const MODULE_KEYS = [
  'leadRecovery',
  'jobs',
  'quickQuote',
  'photos',
  'mileage',
  'inventory',
  'teamManagement',
  'invoices',
]

const MODULE_LABELS: Record<string, string> = {
  leadRecovery: 'Lead Recovery',
  jobs: 'Jobs',
  quickQuote: 'Quick Quote',
  photos: 'Photos',
  mileage: 'Mileage',
  inventory: 'Inventory',
  teamManagement: 'Team',
  invoices: 'Invoices',
}

// ——— Leads helpers ————————————————————————————————————————————————————————

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PROVIDER_STYLES: Record<string, { label: string; className: string }> = {
  google: { label: 'Google', className: 'bg-amber-100 text-amber-900' },
  github: { label: 'GitHub', className: 'bg-zinc-200 text-zinc-800' },
  email: { label: 'Email', className: 'bg-blue-100 text-blue-800' },
  facebook: { label: 'Facebook', className: 'bg-blue-100 text-blue-900' },
}

function LeadsAvatar({
  name,
  picture,
  size = 36,
}: {
  name: string
  picture?: string | null
  size?: number
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?'
  const colors = [
    'bg-violet-600',
    'bg-pink-600',
    'bg-cyan-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-red-600',
  ]
  const bg = colors[name.charCodeAt(0) % colors.length]

  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
      />
    )
  }
  return (
    <div
      className={`${bg} rounded-full flex-shrink-0 text-white flex items-center justify-center font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

function providerBadge(provider: string) {
  const style = PROVIDER_STYLES[provider] ?? {
    label: provider,
    className: 'bg-zinc-200 text-zinc-700',
  }
  return (
    <span
      className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${style.className}`}
    >
      {style.label}
    </span>
  )
}

function SignupRow({ user }: { user: Auth0Signup }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <LeadsAvatar name={user.name} picture={user.picture} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-zinc-500 truncate">{user.email ?? '—'}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {providerBadge(user.provider)}
        <span className="text-[11px] text-zinc-500 font-medium">
          {timeAgo(user.createdAt)}
        </span>
      </div>
    </div>
  )
}

function BookingRow({ booking }: { booking: DemoBooking }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <LeadsAvatar name={booking.name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{booking.name}</p>
        <p className="text-xs text-zinc-500 truncate">{booking.email}</p>
        {booking.message && (
          <p className="text-xs text-zinc-500 mt-1 italic truncate max-w-[280px]">
            &quot;{booking.message}&quot;
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-800">
          DEMO REQ
        </span>
        <span className="text-[11px] text-zinc-500 font-medium">
          {timeAgo(booking.created_at)}
        </span>
      </div>
    </div>
  )
}

function LeadsStatCard({
  label,
  value,
  colorBorder,
}: {
  label: string
  value: number
  colorBorder: string
}) {
  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
      style={{ borderTopWidth: 3, borderTopColor: colorBorder }}
    >
      <p className="text-2xl font-bold text-white mt-0.5" style={{ color: colorBorder }}>
        {value}
      </p>
      <p className="text-xs text-zinc-500 font-medium mt-1">{label}</p>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [adminTab, setAdminTab] = useState<'businesses' | 'leads'>('businesses')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filtered, setFiltered] = useState<Business[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Leads tab state
  const [signups, setSignups] = useState<Auth0Signup[]>([])
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [leadsLoading, setLeadsLoading] = useState({ signups: false, bookings: false })
  const [leadsError, setLeadsError] = useState<{ signups: string | null; bookings: string | null }>({
    signups: null,
    bookings: null,
  })
  const [leadsSubTab, setLeadsSubTab] = useState<'all' | 'signups' | 'bookings'>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      businesses.filter(
        b =>
          b.name.toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
      )
    )
  }, [search, businesses])

  const fetchSignups = useCallback(async () => {
    setLeadsLoading((p) => ({ ...p, signups: true }))
    setLeadsError((p) => ({ ...p, signups: null }))
    try {
      const res = await fetch('/api/admin/auth0-users')
      if (!res.ok) throw new Error('Failed to load sign-ups')
      const data = await res.json()
      setSignups(data.users ?? [])
    } catch (e) {
      setLeadsError((p) => ({ ...p, signups: e instanceof Error ? e.message : 'Failed to load sign-ups' }))
    } finally {
      setLeadsLoading((p) => ({ ...p, signups: false }))
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    setLeadsLoading((p) => ({ ...p, bookings: true }))
    setLeadsError((p) => ({ ...p, bookings: null }))
    const supabase = createClient()
    const { data, error: sbErr } = await supabase
      .from('demo_bookings')
      .select('id, name, email, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (sbErr) {
      const { data: legacyData, error: legacyErr } = await supabase
        .from('demo_bookings')
        .select('id, name, email, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (legacyErr) {
        setLeadsError((p) => ({
          ...p,
          bookings: `demo_bookings: ${sbErr.message}. Ensure the table has columns: id, name, email, message (or notes), created_at.`,
        }))
      } else {
        const mapped = (legacyData ?? []).map(
          (row: { id: string; name: string; email: string; notes?: string | null; created_at: string }) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            message: row.notes ?? null,
            created_at: row.created_at,
          })
        )
        setBookings(mapped as DemoBooking[])
      }
    } else {
      setBookings((data ?? []) as DemoBooking[])
    }
    setLeadsLoading((p) => ({ ...p, bookings: false }))
  }, [])

  useEffect(() => {
    if (authorized !== true || adminTab !== 'leads') return
    fetchSignups()
    fetchBookings()
    const supabase = createClient()
    const channel = supabase
      .channel('demo_bookings_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'demo_bookings' },
        (payload) => {
          setBookings((prev) => [payload.new as DemoBooking, ...prev])
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [authorized, adminTab, fetchSignups, fetchBookings])

  async function checkAuth() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Prefer admin_users table if it exists; fallback to isAdminEmail for existing setup
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const isAdmin = !!adminRow || isAdminEmail(user.email ?? null)
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    setAuthorized(true)
    loadBusinesses()
  }

  async function loadBusinesses() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/businesses')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: err.error || `Failed to load (${res.status})` })
        setBusinesses([])
        setFiltered([])
        return
      }
      const data = (await res.json()) as Business[]
      setBusinesses(data || [])
      setFiltered(data || [])
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load businesses' })
      setBusinesses([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  async function updateBusiness(id: string, updates: Partial<Business>) {
    setSaving(id)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: (data as { error?: string }).error || `Failed (${res.status})` })
      } else {
        setMessage({ type: 'success', text: 'Saved successfully' })
        setBusinesses(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)))
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' })
    } finally {
      setSaving(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function toggleModule(business: Business, moduleKey: string) {
    const current = business.modules || {}
    const isEnabled =
      moduleKey === 'leadRecovery'
        ? (current.leadRecovery as { enabled?: boolean })?.enabled === true
        : current[moduleKey] === true

    const updated = { ...current }
    if (moduleKey === 'leadRecovery') {
      updated.leadRecovery = {
        ...(current.leadRecovery as object),
        enabled: !isEnabled,
      }
    } else {
      updated[moduleKey] = !isEnabled
    }

    await updateBusiness(business.id, { modules: updated })
  }

  function isModuleEnabled(business: Business, moduleKey: string): boolean {
    const m = business.modules || {}
    if (moduleKey === 'leadRecovery')
      return (m.leadRecovery as { enabled?: boolean })?.enabled === true
    return m[moduleKey] === true
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-sm">Checking access...</div>
      </div>
    )
  }

  const allFeed = [
    ...signups.map((u) => ({ ...u, _type: 'signup' as const, _date: u.createdAt })),
    ...bookings.map((b) => ({ ...b, _type: 'booking' as const, _date: b.created_at })),
  ].sort((a, b) => new Date(b._date ?? 0).getTime() - new Date(a._date ?? 0).getTime())

  const todayCount = allFeed.filter(
    (i) => new Date(i._date ?? 0).toDateString() === new Date().toDateString()
  ).length

  const leadsLoadingAny = leadsLoading.signups || leadsLoading.bookings

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">BRNNO Admin</h1>
            <p className="text-xs text-zinc-500">
              {adminTab === 'businesses' ? 'Billing & Plan Management' : 'Sign-ups & demo requests'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
            <button
              onClick={() => setAdminTab('businesses')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                adminTab === 'businesses'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Businesses
            </button>
            <button
              onClick={() => setAdminTab('leads')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                adminTab === 'leads' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Leads
            </button>
          </div>
          <button
            onClick={() =>
              adminTab === 'businesses' ? loadBusinesses() : (fetchSignups(), fetchBookings())
            }
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {adminTab === 'businesses' && (
          <>
        {/* Message */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-950 border border-green-800 text-green-300'
                : 'bg-red-950 border border-red-800 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Businesses', value: businesses.length },
            {
              label: 'Pro Plan',
              value: businesses.filter(b => b.billing_plan === 'pro').length,
            },
            {
              label: 'Free Plan',
              value: businesses.filter(
                b => b.billing_plan === 'free' || !b.billing_plan
              ).length,
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
            >
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-0.5" suppressHydrationWarning>
                {Number(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Loading businesses...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(business => (
              <div
                key={business.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4"
              >
                {/* Business header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{String(business.name ?? '')}</p>
                      <p className="text-xs text-zinc-500">
                        {String(business.email ?? 'No email')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500" suppressHydrationWarning>
                      {typeof business.created_at === 'string'
                        ? new Date(business.created_at).toLocaleDateString()
                        : ''}
                    </p>
                    {business.stripe_subscription_id && (
                      <p className="text-xs text-zinc-600 font-mono mt-0.5">
                        {String(business.stripe_subscription_id).slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1.5 block">Plan</label>
                    <select
                      value={business.billing_plan || 'free'}
                      onChange={e =>
                        updateBusiness(business.id, {
                          billing_plan: e.target.value as 'free' | 'pro',
                        })
                      }
                      disabled={saving === business.id}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1.5 block">
                      Billing Interval
                    </label>
                    <select
                      value={business.billing_interval || 'monthly'}
                      onChange={e =>
                        updateBusiness(business.id, {
                          billing_interval: e.target.value as string,
                        })
                      }
                      disabled={saving === business.id}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                      <option value="founders">Founders</option>
                    </select>
                  </div>
                </div>

                {/* Modules */}
                <div>
                  <label className="text-xs text-zinc-500 mb-2 block">Modules</label>
                  <div className="flex flex-wrap gap-2">
                    {MODULE_KEYS.map(key => {
                      const enabled = isModuleEnabled(business, key)
                      return (
                        <button
                          key={key}
                          onClick={() => toggleModule(business, key)}
                          disabled={saving === business.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                            enabled
                              ? 'bg-indigo-600 text-white border border-indigo-500'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {enabled ? <Check className="h-3 w-3 inline mr-1" /> : null}
                          {MODULE_LABELS[key] ?? key}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {saving === business.id && (
                  <p className="text-xs text-indigo-400">Saving...</p>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No businesses found
              </div>
            )}
          </div>
        )}
          </>
        )}

        {adminTab === 'leads' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <LeadsStatCard
                label="Total Sign-ups"
                value={signups.length}
                colorBorder="#7c3aed"
              />
              <LeadsStatCard
                label="Demo Requests"
                value={bookings.length}
                colorBorder="#0891b2"
              />
              <LeadsStatCard label="Today" value={todayCount} colorBorder="#059669" />
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 border-b border-zinc-800 pb-0">
              {(
                [
                  ['all', 'All Activity'],
                  ['signups', 'Sign-ups'],
                  ['bookings', 'Demo Requests'],
                ] as const
              ).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setLeadsSubTab(t)}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                    leadsSubTab === t
                      ? 'text-white border-white'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Feed */}
            <div className="flex flex-col gap-2">
              {leadsLoadingAny && (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Loading…
                </div>
              )}

              {!leadsLoadingAny && leadsSubTab === 'all' &&
                allFeed.map((item) =>
                  item._type === 'signup' ? (
                    <SignupRow key={`s-${item.id}`} user={item} />
                  ) : (
                    <BookingRow key={`b-${item.id}`} booking={item} />
                  )
                )}

              {!leadsLoadingAny && leadsSubTab === 'signups' &&
                (leadsError.signups ? (
                  <div className="text-center py-6 px-4 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg">
                    {leadsError.signups}
                  </div>
                ) : (
                  signups.map((u) => <SignupRow key={u.id} user={u} />)
                ))}

              {!leadsLoadingAny && leadsSubTab === 'bookings' &&
                (leadsError.bookings ? (
                  <div className="text-center py-6 px-4 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg">
                    {leadsError.bookings}
                  </div>
                ) : (
                  bookings.map((b) => <BookingRow key={b.id} booking={b} />)
                ))}

              {!leadsLoadingAny && allFeed.length === 0 && leadsSubTab === 'all' && (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  No activity yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
