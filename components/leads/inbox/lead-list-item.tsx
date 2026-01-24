'use client'

import { cn } from '@/lib/utils'
import { Clock, CheckCircle2 } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  viewed_at: string | null
  job_id: string | null
}

interface LeadListItemProps {
  lead: Lead
  isSelected: boolean
  onClick: () => void
}

export function LeadListItem({ lead, isSelected, onClick }: LeadListItemProps) {
  const formatLastTouch = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'hot':
        return 'bg-red-500'
      case 'warm':
        return 'bg-orange-500'
      case 'cold':
        return 'bg-cyan-500'
      default:
        return 'bg-zinc-500'
    }
  }

  const isNew = !lead.viewed_at
  const isBooked = lead.status === 'booked'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border transition-all duration-200 relative',
        'hover:bg-zinc-50 dark:hover:bg-white/5',
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/10'
          : isNew
          ? 'border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5 border-l-4 border-l-violet-500'
          : isBooked
          ? 'border-green-500/30 bg-green-50/30 dark:bg-green-500/5 border-l-4 border-l-green-500'
          : 'border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5',
        isNew && 'ring-1 ring-violet-500/20',
        isNew ? 'pl-8 pr-3 py-3' : isBooked ? 'pl-8 pr-3 py-3' : 'p-3'
      )}
    >
      {/* Unread indicator dot */}
      {isNew && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-500" />
      )}
      {/* Booked indicator */}
      {isBooked && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-green-500" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "text-sm truncate",
              isNew 
                ? "font-semibold text-zinc-900 dark:text-white" 
                : isBooked
                ? "font-semibold text-green-700 dark:text-green-400"
                : "font-medium text-zinc-700 dark:text-white/75"
            )}>
              {lead.name}
            </h4>
            {isBooked && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            {!isBooked && (
              <div className={cn('h-2 w-2 rounded-full flex-shrink-0', getScoreColor(lead.score))} />
            )}
          </div>
          
          {lead.phone && (
            <p className="text-xs text-zinc-600 dark:text-white/55 truncate mb-1">
              {lead.phone}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-white/55">
            {isBooked && (
              <span className="text-green-600 dark:text-green-400 font-medium">✅ Booked</span>
            )}
            {lead.interested_in_service_name && !isBooked && (
              <span className="truncate">{lead.interested_in_service_name}</span>
            )}
            {!isBooked && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatLastTouch(lead.last_contacted_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
