'use client'

import { LeadListItem } from './lead-list-item'
import { getDisplayStatus } from './leads-inbox-utils'

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

interface LeadsListProps {
  leads: Lead[]
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
}

export function LeadsList({ leads, selectedLeadId, onSelectLead }: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 p-6 text-center dark:border-white/10">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">No leads here yet</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Try another tab or clear your search.
        </p>
      </div>
    )
  }

  // Sort by last activity (already sorted by layout; keep consistent)
  const sortedLeads = [...leads].sort((a, b) => {
    const aAt = a.last_contacted_at ?? a.created_at
    const bAt = b.last_contacted_at ?? b.created_at
    return new Date(bAt).getTime() - new Date(aAt).getTime()
  })

  return (
    <div className="space-y-3 p-4">
      {sortedLeads.map((lead) => (
        <LeadListItem
          key={lead.id}
          lead={lead}
          displayStatus={getDisplayStatus(lead)}
          isSelected={selectedLeadId === lead.id}
          onClick={() => onSelectLead(lead.id)}
        />
      ))}
    </div>
  )
}
