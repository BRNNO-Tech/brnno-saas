'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getLeadSourceAnalytics } from '@/lib/actions/lead-analytics'

type Range = 'month' | '30days' | 'alltime'

type Row = { source: string; count: number; revenue: number }

const ranges: Array<{ id: Range; label: string }> = [
  { id: 'month', label: 'This Month' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'alltime', label: 'All Time' },
]

const palette = [
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#fb7185', // rose-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
]

function formatMoney(n: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  } catch {
    return `$${Number(n || 0).toFixed(0)}`
  }
}

function formatSourceLabel(source: string) {
  const s = (source || '').trim()
  if (!s) return 'Unknown'
  if (s === 'instagram') return 'Instagram'
  if (s === 'facebook') return 'Facebook'
  if (s === 'google') return 'Google'
  if (s === 'tiktok') return 'TikTok'
  if (s === 'referral') return 'Friend / Referral'
  if (s === 'returning') return 'Returning Customer'
  if (s === 'other') return 'Other'
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AnalyticsTab({ businessId: _businessId }: { businessId?: string }) {
  const [range, setRange] = useState<Range>('month')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getLeadSourceAnalytics(range)
        if (cancelled) return
        setRows(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Failed to load analytics')
        setRows([])
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range])

  const totalBookings = useMemo(() => rows.reduce((sum, r) => sum + (r.count || 0), 0), [rows])
  const totalRevenue = useMemo(() => rows.reduce((sum, r) => sum + (r.revenue || 0), 0), [rows])

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        name: formatSourceLabel(r.source),
        value: r.count,
        source: r.source,
      })),
    [rows]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-dash-condensed font-bold text-[16px] uppercase tracking-wider text-[var(--dash-text)]">
            Analytics
          </div>
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">
            Bookings and revenue by source
          </div>
        </div>
        <div className="flex gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] w-fit">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={[
                'rounded-none px-4 py-2 font-dash-condensed font-bold text-[12px] uppercase tracking-wider transition-colors',
                range === r.id
                  ? 'bg-[var(--dash-amber)] text-[var(--dash-black)]'
                  : 'bg-[var(--dash-surface)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-graphite)]',
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
        <div className="px-4 py-3 border-b border-[var(--dash-border)] flex items-center justify-between gap-4">
          <div className="font-dash-condensed font-bold text-[13px] uppercase tracking-wider text-[var(--dash-text)]">
            Lead Sources
          </div>
          <div className="flex items-center gap-4 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            <span>
              Total bookings:{' '}
              <span className="text-[var(--dash-text)]">{totalBookings}</span>
            </span>
            <span>
              Revenue:{' '}
              <span className="text-[var(--dash-text)]">{formatMoney(totalRevenue)}</span>
            </span>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Loading…</div>
          ) : error ? (
            <div className="font-dash-mono text-[11px] text-red-400">{error}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--dash-border-bright)] p-6 text-center">
              <div className="font-dash-condensed font-bold text-[13px] uppercase tracking-wider text-[var(--dash-text)]">
                No source data yet — the booking form will start collecting this automatically
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[260px] border border-[var(--dash-border)] bg-[var(--dash-surface)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value}`, name]}
                      cursor={{ fill: 'rgba(245, 158, 11, 0.10)' }}
                      contentStyle={{
                        background: 'rgba(17, 24, 39, 0.92)', // slate-ish
                        border: '1px solid rgba(245, 158, 11, 0.28)', // amber tint
                        color: '#e5e7eb',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '12px',
                      }}
                      labelStyle={{
                        color: '#fbbf24',
                        fontFamily: 'var(--font-barlow-condensed)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontSize: '11px',
                        marginBottom: 6,
                      }}
                      itemStyle={{
                        color: '#e5e7eb',
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="border border-[var(--dash-border)] bg-[var(--dash-surface)] overflow-hidden">
                <div className="grid grid-cols-3 gap-0 border-b border-[var(--dash-border)] bg-[var(--dash-graphite)]">
                  <div className="px-4 py-2 font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text)]">
                    Source
                  </div>
                  <div className="px-4 py-2 text-right font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text)]">
                    Bookings
                  </div>
                  <div className="px-4 py-2 text-right font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text)]">
                    Revenue
                  </div>
                </div>
                <div className="divide-y divide-[var(--dash-border)]">
                  {rows.map((r, idx) => (
                    <div key={`${r.source}-${idx}`} className="grid grid-cols-3 gap-0">
                      <div className="px-4 py-2 text-[12px] text-[var(--dash-text)]">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: palette[idx % palette.length] }}
                          />
                          <span className="font-medium">{formatSourceLabel(r.source)}</span>
                        </span>
                      </div>
                      <div className="px-4 py-2 text-right font-dash-mono text-[11px] text-[var(--dash-text)]">
                        {r.count}
                      </div>
                      <div className="px-4 py-2 text-right font-dash-mono text-[11px] text-[var(--dash-text)]">
                        {formatMoney(r.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

