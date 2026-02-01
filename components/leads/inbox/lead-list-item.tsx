'use client'

import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import {
  getDisplayStatus,
  timeAgo,
  formatMoney,
  STATUS_LABEL,
  STATUS_DOT_CLASS,
  STATUS_PILL_CLASS,
  type DisplayStatus,
} from './leads-inbox-utils'

interface Lead {
  id: string
  name: string
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

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        className
      )}
    >
      {children}
    </span>
  )
}

export function LeadListItem({ lead, displayStatus, isSelected, onClick }: LeadListItemProps) {
  const lastActivity = lead.last_contacted_at ?? lead.created_at

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl p-3 text-left ring-1 transition',
        isSelected
          ? 'bg-violet-50 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/30'
          : 'bg-white ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:ring-white/10 dark:hover:bg-white/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-3 w-3 items-center justify-center">
          <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT_CLASS[displayStatus])} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate font-semibold text-zinc-900 dark:text-white">{lead.name}</div>
            <Pill className={STATUS_PILL_CLASS[displayStatus]}>{STATUS_LABEL[displayStatus]}</Pill>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="truncate text-sm text-zinc-700 dark:text-zinc-300">
              {lead.interested_in_service_name ?? '—'}
              {lead.estimated_value != null && (
                <> • {formatMoney(lead.estimated_value)}</>
              )}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(lastActivity)}
          </div>
        </div>
      </div>
    </button>
  )
}
