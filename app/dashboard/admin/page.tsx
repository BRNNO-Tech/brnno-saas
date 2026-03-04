'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Search, Check, X, RefreshCw, Building2 } from 'lucide-react'
import { isAdminEmail } from '@/lib/permissions'

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

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filtered, setFiltered] = useState<Business[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
            <p className="text-xs text-zinc-500">Billing & Plan Management</p>
          </div>
        </div>
        <button
          onClick={loadBusinesses}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="px-6 py-6 space-y-4">
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
                      <option value="pro">Pro Plus</option>
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
      </div>
    </div>
  )
}
