import { redirect } from 'next/navigation'
import { getMileageRecords, getMileageSummary } from '@/lib/actions/mileage'
import { getBusinessId } from '@/lib/actions/utils'
import { getBusiness } from '@/lib/actions/business'
import { canAccessMileage } from '@/lib/actions/permissions'
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
    <div className="w-full pb-20 md:pb-0 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end">
        <MileageExportButton />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--dash-border)] border border-[var(--dash-border)]">
          {[
            { label: 'This Month', miles: summary.thisMonth.miles, deduction: summary.thisMonth.deduction, color: 'var(--dash-blue)' },
            { label: 'This Year', miles: summary.thisYear.miles, deduction: summary.thisYear.deduction, color: 'var(--dash-green)' },
            { label: 'This Week', miles: summary.thisWeek.miles, deduction: summary.thisWeek.deduction, color: 'var(--dash-amber)' },
            { label: 'Today', miles: summary.today.miles, deduction: summary.today.deduction, color: 'var(--dash-text-muted)' },
          ].map(({ label, miles, deduction, color }) => (
            <div key={label} className="bg-[var(--dash-graphite)] p-5" style={{ borderBottom: `2px solid ${color}` }}>
              <div className="font-dash-mono text-[10px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] mb-3">{label}</div>
              <div className="font-dash-condensed font-extrabold text-3xl leading-none text-[var(--dash-text)] mb-1">{miles.toFixed(1)} <span className="text-lg">mi</span></div>
              <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">${deduction.toFixed(2)} deduction</div>
            </div>
          ))}
        </div>
      )}

      {/* Mileage Records */}
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
        <div className="px-5 py-4 border-b border-[var(--dash-border)]">
          <div className="font-dash-condensed font-bold text-[15px] uppercase tracking-wider text-[var(--dash-text)]">Mileage Records</div>
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">All tracked mileage for tax reporting</div>
        </div>
        <MileageReportClient initialRecords={records} initialSummary={summary} />
      </div>
    </div>
  )
}
