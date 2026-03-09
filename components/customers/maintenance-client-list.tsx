'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarPlus } from 'lucide-react'
import { useOpenNewJob } from '@/lib/contexts/open-new-job-context'
import type { MaintenanceClientRow } from '@/lib/actions/clients'

function getIntervalLabel(row: MaintenanceClientRow): string {
  switch (row.maintenance_interval) {
    case 'weekly':
      return 'Weekly'
    case 'biweekly':
      return 'Bi-weekly'
    case 'monthly':
      return 'Monthly'
    case 'custom':
      return row.maintenance_interval_days != null
        ? `Every ${row.maintenance_interval_days} days`
        : 'Custom'
    default:
      return '—'
  }
}

function getStatusBadge(nextDue: string | null) {
  if (!nextDue) return { label: '—', className: '' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDue)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { label: 'Overdue', className: 'bg-[var(--dash-red)]/20 text-[var(--dash-red)] border-[var(--dash-red)]/40' }
  }
  if (diffDays <= 3) {
    return { label: 'Due soon', className: 'bg-[var(--dash-amber)]/20 text-[var(--dash-amber)] border-[var(--dash-amber)]/40' }
  }
  return { label: 'Upcoming', className: 'bg-[var(--dash-green)]/20 text-[var(--dash-green)] border-[var(--dash-green)]/40' }
}

export default function MaintenanceClientList({ rows }: { rows: MaintenanceClientRow[] }) {
  const { setOpenWithClientId } = useOpenNewJob()

  if (rows.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">
          No maintenance clients yet
        </div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mb-4">
          Set a maintenance schedule on a client from their detail page (Customers → select a client → Maintenance Schedule).
        </div>
        <Link
          href="/dashboard/customers"
          className="inline-block font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-amber)] hover:underline"
        >
          View all customers
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full font-dash-mono text-[12px]">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-[var(--dash-text-muted)] uppercase tracking-wider text-[10px]">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Last service</th>
              <th className="text-left py-3 px-4">Interval</th>
              <th className="text-left py-3 px-4">Next due</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = getStatusBadge(row.nextDue)
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--dash-border)] last:border-b-0 hover:bg-[var(--dash-surface)]/30"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/customers/${row.id}`}
                      className="font-medium text-[var(--dash-text)] hover:text-[var(--dash-amber)]"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[var(--dash-text-muted)]">
                    {row.stats.lastJobDate
                      ? new Date(row.stats.lastJobDate).toLocaleDateString()
                      : 'No prior service'}
                  </td>
                  <td className="py-3 px-4 text-[var(--dash-text)]">{getIntervalLabel(row)}</td>
                  <td className="py-3 px-4 text-[var(--dash-text)]">
                    {row.nextDue ? new Date(row.nextDue).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
                      onClick={() => setOpenWithClientId(row.id)}
                    >
                      <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                      Schedule
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
