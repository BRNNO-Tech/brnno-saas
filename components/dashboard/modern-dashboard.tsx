'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useOpenNewJob } from '@/lib/contexts/open-new-job-context'
import CreateInvoiceButton from '@/components/invoices/create-invoice-button'
import {
  Briefcase,
  Receipt,
  MessageSquare,
  FileText,
  ChevronUp,
} from 'lucide-react'
import { MileageWidget } from '@/components/mileage/mileage-widget'
import { DashboardPhotosWidget } from './dashboard-photos-widget'
import { DashboardWeatherWidget } from './dashboard-weather-widget'
import type { CustomerDashboardPhoto, WorkerDashboardPhoto } from '@/lib/actions/dashboard-photos'

const currency = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type DashboardStats = {
  totalClients?: number
  activeJobs?: number
  revenueMTD?: number
  revenueLastMonth?: number
  jobsCompletedThisMonth?: number
  leadsThisMonth?: number
  recentActivity?: any[]
}

type LeadRow = {
  id: string
  name?: string | null
  estimated_value?: number | null
  score?: string | null
  created_at: string
}

type JobRow = {
  id: string
  title?: string | null
  scheduled_date?: string | null
  status?: string
  service_type?: string | null
  client?: { name?: string | null } | null
  total?: number
}

type DashboardData = {
  stats: DashboardStats
  monthlyRevenue: Array<{ name: string; total: number }>
  weeklyRevenue: Array<{ name: string; total: number }>
  upcomingJobs: JobRow[]
  businessName: string
  businessAddress?: string | null
  mileageSummary?: {
    today: { miles: number; deduction: number }
    thisWeek: { miles: number; deduction: number }
    thisMonth: { miles: number; deduction: number }
    thisYear: { miles: number; deduction: number }
  } | null
  photos?: {
    customerPhotos: CustomerDashboardPhoto[]
    workerPhotos: WorkerDashboardPhoto[]
    totalCount: number
  } | null
  unreadLeadsCount?: number
  hotLeads?: LeadRow[]
  hasInvoiceModule?: boolean
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins}h ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

function formatJobTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getMonthLabel(): string {
  const d = new Date()
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function ModernDashboard({
  stats,
  monthlyRevenue,
  weeklyRevenue = [],
  upcomingJobs,
  businessName,
  businessAddress = null,
  mileageSummary,
  photos,
  unreadLeadsCount = 0,
  hotLeads = [],
  hasInvoiceModule = false,
}: DashboardData) {
  const { requestNewJobSheet } = useOpenNewJob()
  const quickTileClass =
    'flex items-center gap-3 p-4 bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors w-full text-left min-h-[4.5rem]'
  const safeStats = stats ?? { totalClients: 0, activeJobs: 0, revenueMTD: 0, revenueLastMonth: 0, jobsCompletedThisMonth: 0, leadsThisMonth: 0 }
  const revenueMTD = safeStats.revenueMTD ?? 0
  const revenueLastMonth = safeStats.revenueLastMonth ?? 0
  const jobsDone = safeStats.jobsCompletedThisMonth ?? 0
  const leadsIn = safeStats.leadsThisMonth ?? 0
  const avgTicket = jobsDone > 0 ? Math.round((revenueMTD / jobsDone) * 100) / 100 : 0
  const revenueDiff = revenueLastMonth > 0 ? revenueMTD - revenueLastMonth : 0
  const monthLabel = getMonthLabel()

  const todayStart = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])
  const todayEnd = useMemo(() => {
    const t = new Date()
    t.setHours(23, 59, 59, 999)
    return t
  }, [])
  const todaysJobs = useMemo(() => {
    return (upcomingJobs ?? []).filter((j) => {
      const d = j.scheduled_date ? new Date(j.scheduled_date) : null
      if (!d) return false
      return d >= todayStart && d <= todayEnd
    })
  }, [upcomingJobs, todayStart, todayEnd])

  const maxWeekly = useMemo(() => Math.max(...weeklyRevenue.map((w) => w.total), 1), [weeklyRevenue])

  return (
    <div className="relative w-full pb-20 md:pb-0">
      {/* Alert banner */}
      {unreadLeadsCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-6 rounded border border-[var(--dash-red)]/30 bg-[var(--dash-red)]/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[var(--dash-red)] flex-shrink-0" />
            <div>
              <span className="font-dash-condensed font-semibold text-[13px] uppercase tracking-wide text-[var(--dash-red)]">
                {unreadLeadsCount} LEAD{unreadLeadsCount !== 1 ? 'S' : ''} NEED ATTENTION
              </span>
              <span className="ml-1 text-xs text-[var(--dash-text-dim)] font-sans normal-case">— Hot leads uncontacted for 24h+</span>
            </div>
          </div>
          <Link
            href="/dashboard/leads"
            className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider px-2.5 py-1.5 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors"
          >
            VIEW →
          </Link>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.2em]">This Month</span>
        <div className="flex-1 h-px bg-[var(--dash-border)]" />
        <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.2em]">{monthLabel}</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-[var(--dash-border)] mb-6 bg-[var(--dash-border)]">
        <div className="bg-[var(--dash-graphite)] p-5 relative overflow-hidden group cursor-pointer hover:bg-[var(--dash-surface)] transition-colors border-b-2 border-b-[var(--dash-amber)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Revenue</div>
          <div className="font-dash-condensed font-extrabold text-4xl md:text-5xl leading-none text-[var(--dash-amber)] tracking-tight mb-2">{currency(revenueMTD)}</div>
          <div
            className={cn(
              'flex items-center gap-1 font-dash-mono text-[11px]',
              revenueDiff > 0 ? 'text-[var(--dash-green)]' : revenueDiff < 0 ? 'text-[var(--dash-red)]' : 'text-[var(--dash-text-muted)]'
            )}
          >
            {revenueDiff > 0 && <ChevronUp className="h-2.5 w-2.5" />}
            {revenueDiff !== 0 ? `${revenueDiff >= 0 ? '+' : ''}${currency(revenueDiff)} vs last month` : '— first month'}
          </div>
        </div>
        <div className="bg-[var(--dash-graphite)] p-5 relative overflow-hidden group cursor-pointer hover:bg-[var(--dash-surface)] transition-colors border-b-2 border-transparent hover:border-[var(--dash-border-bright)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Jobs Done</div>
          <div className="font-dash-condensed font-extrabold text-4xl md:text-5xl leading-none text-[var(--dash-text)] tracking-tight mb-2">{jobsDone}</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">— this month</div>
        </div>
        <div className="bg-[var(--dash-graphite)] p-5 relative overflow-hidden group cursor-pointer hover:bg-[var(--dash-surface)] transition-colors border-b-2 border-transparent hover:border-[var(--dash-border-bright)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Leads In</div>
          <div className="font-dash-condensed font-extrabold text-4xl md:text-5xl leading-none text-[var(--dash-text)] tracking-tight mb-2">{leadsIn}</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">— same as last month</div>
        </div>
        <div className="bg-[var(--dash-graphite)] p-5 relative overflow-hidden group cursor-pointer hover:bg-[var(--dash-surface)] transition-colors border-b-2 border-transparent hover:border-[var(--dash-border-bright)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Avg Ticket</div>
          <div className="font-dash-condensed font-extrabold text-4xl md:text-5xl leading-none text-[var(--dash-text)] tracking-tight mb-2">{currency(avgTicket)}</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">— this month</div>
        </div>
      </div>

      {/* Revenue chart — Last 8 weeks */}
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] mb-6">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--dash-border)]">
          <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Revenue — Last 8 Weeks</span>
          <span className="font-dash-mono text-[11px] text-[var(--dash-amber)]">{currency(revenueMTD)} MTD</span>
        </div>
        <div className="flex items-end gap-1.5 px-4 py-5 h-[120px]">
          {weeklyRevenue.slice(0, 8).map((w) => {
            const pct = maxWeekly > 0 ? (w.total / maxWeekly) * 100 : 0
            const barHeight = Math.max(4, Math.min(100, pct))
            const isNow = w.name === 'NOW'
            return (
              <div key={w.name} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-h-0">
                <div
                  className={cn(
                    'w-full rounded-t min-h-[4px] transition-colors flex-shrink-0',
                    isNow ? 'bg-[var(--dash-amber)]' : 'bg-[var(--dash-border-bright)] hover:bg-[var(--dash-amber-dim)]'
                  )}
                  style={{ height: `${barHeight}%` }}
                />
                <span
                  className={cn(
                    'font-dash-mono text-[9px] tracking-wider flex-shrink-0',
                    isNow ? 'text-[var(--dash-amber)] font-dash-condensed font-semibold' : 'text-[var(--dash-text-muted)]'
                  )}
                >
                  {w.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two column: Today's Jobs | Quick Actions + Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        {/* Today's Jobs */}
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--dash-border)]">
            <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Today&apos;s Jobs</span>
            <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] border border-[var(--dash-border)] bg-[var(--dash-surface)] px-2 py-0.5">
              {todaysJobs.length} SCHEDULED
            </span>
          </div>
          <div className="divide-y divide-[var(--dash-border)]">
            {todaysJobs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">Clear Schedule</div>
                <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No jobs today — time to close some leads</div>
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors">
                  + Add Job
                </Link>
              </div>
            ) : (
              todaysJobs.map((j) => (
                <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-[var(--dash-border)] last:border-b-0 hover:bg-[var(--dash-surface)] transition-colors">
                  <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] w-10 text-right flex-shrink-0">
                    {j.scheduled_date ? formatJobTime(j.scheduled_date) : '—'}
                  </span>
                  <div
                    className={cn(
                      'w-0.5 h-8 rounded-sm flex-shrink-0',
                      j.status === 'in_progress' && 'bg-[var(--dash-amber)] shadow-[0_0_8px_var(--dash-amber-dim)]',
                      j.status === 'scheduled' && 'bg-[var(--dash-blue)]',
                      j.status === 'completed' && 'bg-[var(--dash-green)]'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-dash-condensed font-semibold text-[15px] text-[var(--dash-text)] truncate">
                      {j.client?.name ?? j.title ?? 'Job'}
                    </div>
                    <div className="text-xs text-[var(--dash-text-muted)]">{j.service_type ?? j.title ?? '—'}</div>
                  </div>
                  <span className="font-dash-mono text-[13px] text-[var(--dash-text-dim)] flex-shrink-0">
                    {typeof j.total === 'number' ? currency(j.total) : '—'}
                  </span>
                  <span
                    className={cn(
                      'font-dash-mono text-[10px] px-2 py-1 border uppercase tracking-wider flex-shrink-0',
                      j.status === 'in_progress' && 'text-[var(--dash-amber)] border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)]',
                      j.status === 'scheduled' && 'text-[var(--dash-blue)] border-[var(--dash-blue)]/30',
                      j.status === 'completed' && 'text-[var(--dash-green)] border-[var(--dash-green)]/30'
                    )}
                  >
                    {j.status === 'in_progress' ? 'In Progress' : j.status === 'scheduled' ? 'Scheduled' : j.status ?? '—'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right column: Quick Actions + Hot Leads */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.2em]">Quick Actions</span>
              <div className="flex-1 h-px bg-[var(--dash-border)]" />
            </div>
            <div className="grid grid-cols-2 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
              <button type="button" onClick={() => requestNewJobSheet()} className={quickTileClass}>
                <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-dash-condensed font-bold text-sm uppercase tracking-wide text-[var(--dash-text)]">New Job</div>
                  <div className="text-[11px] text-[var(--dash-text-muted)]">Schedule a job</div>
                </div>
              </button>
              <CreateInvoiceButton
                hasModule={hasInvoiceModule}
                trigger={
                  <button type="button" className={quickTileClass}>
                    <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-dash-condensed font-bold text-sm uppercase tracking-wide text-[var(--dash-text)]">Invoice</div>
                      <div className="text-[11px] text-[var(--dash-text-muted)]">Create & send</div>
                    </div>
                  </button>
                }
              />
              <Link href="/dashboard/messages" className={quickTileClass}>
                <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-dash-condensed font-bold text-sm uppercase tracking-wide text-[var(--dash-text)]">Message</div>
                  <div className="text-[11px] text-[var(--dash-text-muted)]">Contact client</div>
                </div>
              </Link>
              <Link href="/dashboard/quick-quote" className={quickTileClass}>
                <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-dash-condensed font-bold text-sm uppercase tracking-wide text-[var(--dash-text)]">Quick Quote</div>
                  <div className="text-[11px] text-[var(--dash-text-muted)]">Send estimate</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Hot Leads */}
          {hotLeads.length > 0 ? (
            <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--dash-border)]">
                <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Hot Leads</span>
                <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] border border-[var(--dash-border)] bg-[var(--dash-surface)] px-2 py-0.5">
                  {hotLeads.length} ACTIVE
                </span>
              </div>
              <div className="divide-y divide-[var(--dash-border)]">
                {hotLeads.slice(0, 5).map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads`}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[var(--dash-surface)] transition-colors"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full flex-shrink-0',
                        lead.score === 'hot' && 'bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]',
                        lead.score === 'warm' && 'bg-[var(--dash-amber)] shadow-[0_0_6px_var(--dash-amber-dim)]',
                        lead.score === 'cold' && 'bg-[var(--dash-text-muted)]'
                      )}
                    />
                    <span className="font-dash-condensed font-semibold text-sm text-[var(--dash-text)] flex-1 truncate">{lead.name ?? 'Lead'}</span>
                    <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{formatTimeAgo(lead.created_at)}</span>
                    <span className="font-dash-mono text-xs text-[var(--dash-text-dim)] w-14 text-right">
                      {typeof lead.estimated_value === 'number' ? currency(lead.estimated_value) : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
              <div className="px-4 py-3.5 border-b border-[var(--dash-border)]">
                <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Hot Leads</span>
              </div>
              <div className="px-4 py-6 text-center">
                <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No hot leads right now</div>
              </div>
            </div>
          )}

          {mileageSummary && (
            <Link href="/dashboard/mileage" className="block">
              <MileageWidget summary={mileageSummary} />
            </Link>
          )}
        </div>
      </div>

      {/* Weather */}
      {businessAddress && <DashboardWeatherWidget businessAddress={businessAddress} />}

      {/* Photos */}
      {photos && (
        <div className="mt-6">
          <DashboardPhotosWidget
            customerPhotos={photos.customerPhotos}
            workerPhotos={photos.workerPhotos}
            totalCount={photos.totalCount}
          />
        </div>
      )}
    </div>
  )
}
