'use client'

import { cn } from '@/lib/utils'
import { MessageSquare, Mail, Phone, Clock } from 'lucide-react'
import { LeadListSkeleton } from './lead-list-skeleton'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  viewed_at: string | null
}

interface LeadsListPanelProps {
  leads: Lead[]
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
  loading?: boolean
}

export function LeadsListPanel({ leads, selectedLeadId, onSelectLead, loading }: LeadsListPanelProps) {
  if (loading) {
    return <LeadListSkeleton />
  }
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

  const isAtRisk = (lead: Lead) => {
    if (!lead.last_contacted_at) return true
    const hoursSinceContact = (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60)
    if (lead.score === 'hot' && hoursSinceContact >= 24) return true
    if (lead.score === 'warm' && hoursSinceContact >= 48) return true
    return false
  }

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium">No leads found</p>
          <p className="text-xs">Try adjusting your filters or views</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {leads.map((lead, index) => {
        const isSelected = selectedLeadId === lead.id
        const isNew = !lead.viewed_at
        const atRisk = isAtRisk(lead)

        return (
          <button
            key={lead.id}
            onClick={() => onSelectLead(lead.id)}
            className={cn(
              'w-full text-left p-4 rounded-xl border transition-all duration-200',
              'hover:bg-zinc-50 dark:hover:bg-white/5 hover:shadow-md hover:-translate-y-0.5',
              'active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50',
              isSelected
                ? 'border-violet-500/50 dark:border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/10 shadow-md ring-2 ring-violet-500/20 dark:ring-violet-500/20'
                : 'border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5',
              isNew && 'ring-2 ring-violet-500/20 dark:ring-violet-500/20',
              atRisk && 'border-l-4 border-l-orange-500'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                    {lead.name}
                  </h4>
                  <div className={cn('h-2 w-2 rounded-full flex-shrink-0', getScoreColor(lead.score))} />
                </div>
                
                {lead.phone && (
                  <p className="text-xs text-zinc-600 dark:text-white/55 truncate">
                    {lead.phone}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600 dark:text-white/55">
                  {lead.interested_in_service_name && (
                    <span className="truncate">{lead.interested_in_service_name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastTouch(lead.last_contacted_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Channel icons */}
                <div className="flex items-center gap-1">
                  {lead.phone && (
                    <Phone className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  )}
                  {lead.email && (
                    <Mail className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  )}
                  {lead.follow_up_count > 0 && (
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  )}
                </div>

                {/* Score badge */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    lead.score === 'hot' && 'bg-red-500/15 text-red-700 dark:text-red-300',
                    lead.score === 'warm' && 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                    lead.score === 'cold' && 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  )}
                >
                  {lead.score}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
