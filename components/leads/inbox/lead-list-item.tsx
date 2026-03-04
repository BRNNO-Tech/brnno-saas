'use client'

import { cn } from '@/lib/utils'
import { timeAgo, formatMoney, type DisplayStatus } from './leads-inbox-utils'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  created_at: string
  viewed_at: string | null
  job_id: string | null
}

interface LeadListItemProps {
  lead: Lead
  displayStatus: DisplayStatus
  isSelected: boolean
  onClick: () => void
}

const BAR_CLASS: Record<DisplayStatus, string> = {
  new: 'bg-[var(--dash-blue)]',
  followup: 'bg-[var(--dash-amber)]',
  warm: 'bg-[var(--dash-amber)]',
  hot: 'bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]',
  booked: 'bg-[var(--dash-green)]',
  cold: 'bg-[var(--dash-border-bright)]',
}

export function LeadListItem({ lead, displayStatus, isSelected, onClick }: LeadListItemProps) {
  const lastActivity = lead.last_contacted_at ?? lead.created_at

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected
          ? 'bg-[var(--dash-surface)] border-l-2 border-l-[var(--dash-amber)]'
          : 'bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] border-l-2 border-l-transparent'
      )}
    >
      {/* Status bar */}
      <div className={cn('w-0.5 h-10 rounded-sm flex-shrink-0', BAR_CLASS[displayStatus])} />

      {/* Avatar */}
      <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-[var(--dash-surface)] border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-sm text-[var(--dash-text-dim)]">
        {lead.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + service + meta */}
      <div className="min-w-0 flex-1">
        <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-text)] truncate">
          {lead.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] truncate max-w-[140px] sm:max-w-none">
            {lead.interested_in_service_name ?? '—'}
          </span>
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-dim)]">
            {timeAgo(lastActivity)}
          </span>
        </div>
      </div>

      {/* Revenue */}
      {lead.estimated_value != null && lead.estimated_value > 0 && (
        <div className="flex-shrink-0 text-right">
          <div className="font-dash-condensed font-bold text-[14px] text-[var(--dash-amber)]">
            {formatMoney(lead.estimated_value)}
          </div>
        </div>
      )}
    </button>
  )
}
