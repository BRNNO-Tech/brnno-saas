'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Navigation,
  MapPin,
  Edit2,
  DollarSign 
} from 'lucide-react'
import { formatAddress, calculateMileageDeduction, getIRSRate } from '@/lib/utils/mileage-utils'
import type { MileageRecordWithJob, MileageSummary } from '@/types/mileage'

interface MileageReportClientProps {
  initialRecords: MileageRecordWithJob[]
  initialSummary?: MileageSummary
}

export default function MileageReportClient({ 
  initialRecords, 
  initialSummary 
}: MileageReportClientProps) {
  const [records, setRecords] = useState(initialRecords)
  const [summary, setSummary] = useState(initialSummary)
  const irsRate = getIRSRate()

  return (
    <div className="space-y-0">
      {/* Mileage Records */}
      <div className="p-4">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <Navigation className="mx-auto h-10 w-10 text-[var(--dash-text-muted)] mb-3" />
              <div className="font-dash-condensed font-bold text-[15px] uppercase tracking-wide text-[var(--dash-text)] mb-1">No mileage tracked yet</div>
              <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Complete jobs to automatically track mileage</p>
            </div>
          ) : (
            <div className="space-y-px">
              {records.map((record) => {
                const fromAddr = formatAddress(
                  record.from_address,
                  record.from_city,
                  record.from_state,
                  record.from_zip
                )
                const toAddr = formatAddress(
                  record.to_address,
                  record.to_city,
                  record.to_state,
                  record.to_zip
                )
                const deduction = calculateMileageDeduction(record.miles_driven, irsRate)

                return (
                  <div
                    key={record.id}
                    className="border-l-2 border-l-[var(--dash-blue)] border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4 hover:bg-[var(--dash-surface)] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* Date */}
                        <div className="flex items-center gap-2 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
                          <Calendar className="h-4 w-4" />
                          {new Date(record.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>

                        {/* Route */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <div className="w-0.5 h-8 bg-muted-foreground/30" />
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div>
                              <p className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)]">From</p>
                              <p className="font-dash-mono text-[11px] text-[var(--dash-text)]">
                                {fromAddr || 'Start of day'}
                              </p>
                            </div>
                            <div>
                              <p className="font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)]">To</p>
                              <p className="font-dash-mono text-[11px] text-[var(--dash-text)]">
                                {toAddr || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {record.notes}
                          </p>
                        )}
                      </div>

                      {/* Miles & Badge */}
                      <div className="text-right space-y-2">
                        <div>
                          <p className="font-dash-condensed font-extrabold text-2xl text-[var(--dash-text)]">{record.miles_driven.toFixed(1)}</p>
                          <p className="font-dash-mono text-[9px] text-[var(--dash-text-muted)]">miles</p>
                        </div>
                        {record.is_manual_override && (
                          <div className="flex items-center gap-1 border border-[var(--dash-border-bright)] px-1.5 py-0.5 font-dash-mono text-[9px] text-[var(--dash-text-muted)]">
                            <Edit2 className="h-2.5 w-2.5" />
                            Manual
                          </div>
                        )}
                        <p className="font-dash-mono text-[11px] text-[var(--dash-green)]">
                          ${deduction.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Tax Info Footer */}
      <div className="border-t border-[var(--dash-border)] px-5 py-4 flex items-start gap-3">
        <DollarSign className="h-4 w-4 text-[var(--dash-green)] mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-dash-condensed font-bold text-[13px] uppercase tracking-wide text-[var(--dash-text)] mb-1">IRS Mileage Deduction</div>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] leading-relaxed">
            The IRS standard mileage rate for 2024 is <span className="text-[var(--dash-amber)]">${irsRate.toFixed(2)}/mile</span> for business use. Keep these records for tax purposes. Consult a tax professional for specific advice.
          </p>
        </div>
      </div>
    </div>
  )
}
