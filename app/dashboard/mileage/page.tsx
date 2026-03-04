import { redirect } from 'next/navigation'
import { getMileageRecords, getMileageSummary } from '@/lib/actions/mileage'
import { getBusinessId } from '@/lib/actions/utils'
import { getBusiness } from '@/lib/actions/business'
import { canAccessMileage } from '@/lib/actions/permissions'
import { Navigation, TrendingUp } from 'lucide-react'
import { GlowBG } from '@/components/ui/glow-bg'
import { CardShell } from '@/components/ui/card-shell'
import MileageReportClient from '@/components/mileage/mileage-report-client'
import { MileageExportButton } from '@/components/mileage/mileage-export-button'
import { DashboardPageError } from '@/components/dashboard/page-error'
import UpgradePrompt from '@/components/upgrade-prompt'

export default async function MileagePage() {
  const canView = await canAccessMileage()
  if (!canView) {
    return <UpgradePrompt moduleMode feature="Mileage Tracker" />
  }
  let businessId: string

  try {
    businessId = await getBusinessId()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred.'
    try {
      const b = await getBusiness()
      if (b && b.subscription_status !== 'active' && b.subscription_status !== 'trialing') {
        return <DashboardPageError isTrialEnded />
      }
    } catch { /* ignore */ }
    if (msg.includes('Not authenticated') || msg.includes('Authentication error')) {
      redirect('/login')
    }
    const isNoBusiness = msg.includes('No business found')
    return (
      <DashboardPageError
        message={msg}
        isNoBusiness={isNoBusiness}
        title={isNoBusiness ? 'Business Setup Required' : 'Unable to load mileage'}
      />
    )
  }

  let summary = null
  let records: any[] = []

  try {
    summary = await getMileageSummary()
  } catch (error) {
    console.error('Error loading mileage summary:', error)
    // Use default empty summary
    summary = {
      today: { miles: 0, deduction: 0 },
      thisWeek: { miles: 0, deduction: 0 },
      thisMonth: { miles: 0, deduction: 0 },
      thisYear: { miles: 0, deduction: 0 },
    }
  }

  try {
    records = await getMileageRecords()
  } catch (error) {
    console.error('Error loading mileage records:', error)
    // Records will be empty array
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Mileage Tracking</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Track your business miles for tax deductions
              </p>
            </div>
            <MileageExportButton />
          </div>

          {/* Summary Cards */}
          {summary && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/18 dark:from-blue-500/18 to-blue-500/5 dark:to-blue-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/20 dark:ring-blue-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100/50 dark:bg-blue-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">This Month</p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{summary.thisMonth.miles.toFixed(1)} mi</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                ${summary.thisMonth.deduction.toFixed(2)} deduction
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">This Year</p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{summary.thisYear.miles.toFixed(1)} mi</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                ${summary.thisYear.deduction.toFixed(2)} deduction
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">This Week</p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{summary.thisWeek.miles.toFixed(1)} mi</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                ${summary.thisWeek.deduction.toFixed(2)} deduction
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/18 dark:from-purple-500/18 to-purple-500/5 dark:to-purple-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-purple-500/20 dark:ring-purple-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-purple-100/50 dark:bg-purple-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Today</p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{summary.today.miles.toFixed(1)} mi</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                ${summary.today.deduction.toFixed(2)} deduction
              </p>
            </div>
          </div>
          )}

          {/* Mileage Records */}
          <CardShell title="Mileage Records" subtitle="All tracked mileage for tax reporting">
            <MileageReportClient initialRecords={records} initialSummary={summary} />
          </CardShell>
        </div>
      </div>
    </div>
  )
}
