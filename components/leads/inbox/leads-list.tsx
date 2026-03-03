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
      <div className="px-4 py-10 text-center">
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No leads in this tab</div>
        <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-1">Try another tab or clear search</div>
      </div>
    )
  }

  const sortedLeads = [...leads].sort((a, b) => {
    const aAt = a.last_contacted_at ?? a.created_at
    const bAt = b.last_contacted_at ?? b.created_at
    return new Date(bAt).getTime() - new Date(aAt).getTime()
  })

  return (
    <div className="space-y-px">
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
