'use client'

import { Navigation, TrendingUp, DollarSign } from 'lucide-react'
import type { MileageSummary } from '@/types/mileage'
import { getIRSRate } from '@/lib/utils/mileage-utils'

interface MileageWidgetProps {
  summary: MileageSummary
  irsRate?: number // Default $0.67/mile
}

export function MileageWidget({ summary, irsRate }: MileageWidgetProps) {
  const rate = irsRate ?? getIRSRate()

  const todayMiles = summary.today.miles
  const weekMiles = summary.thisWeek.miles
  const monthMiles = summary.thisMonth.miles
  const yearMiles = summary.thisYear.miles

  const monthlyDeduction = irsRate
    ? Math.round(monthMiles * rate * 100) / 100
    : summary.thisMonth.deduction
  const yearlyDeduction = irsRate
    ? Math.round(yearMiles * rate * 100) / 100
    : summary.thisYear.deduction

  return (
    <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--dash-border)]">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
            <Navigation className="h-4 w-4" />
          </div>
          <div>
            <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">
              Mileage Tracking
            </span>
            <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">
              Track miles for tax deductions
            </p>
          </div>
        </div>
        <TrendingUp className="h-4 w-4 text-[var(--dash-green)]" />
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Today', value: todayMiles.toFixed(1) },
            { label: 'This Week', value: weekMiles.toFixed(1) },
            { label: 'This Month', value: monthMiles.toFixed(1) },
            { label: 'This Year', value: yearMiles.toFixed(1) },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider">
                {label}
              </p>
              <p className="font-dash-condensed font-extrabold text-xl text-[var(--dash-text)]">
                {value}
              </p>
              <p className="font-dash-mono text-[9px] text-[var(--dash-text-muted)]">miles</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[var(--dash-border)] space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--dash-green)]" />
            <span className="font-dash-condensed font-bold text-xs uppercase tracking-wider text-[var(--dash-text)]">
              Tax Deductions
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 border border-[var(--dash-border)] bg-[var(--dash-surface)] rounded">
              <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mb-1">
                This Month
              </p>
              <p className="font-dash-condensed font-bold text-lg text-[var(--dash-green)]">
                ${monthlyDeduction.toLocaleString()}
              </p>
            </div>
            <div className="p-3 border border-[var(--dash-border)] bg-[var(--dash-surface)] rounded">
              <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mb-1">
                This Year
              </p>
              <p className="font-dash-condensed font-bold text-lg text-[var(--dash-green)]">
                ${yearlyDeduction.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            Based on IRS rate of ${rate}/mile
          </p>
        </div>
      </div>
    </div>
  )
}
