'use client'

import { LeadListItem } from './lead-list-item'

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
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400 p-8">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">No leads found</p>
        </div>
      </div>
    )
  }

  // Sort: unread first, then by created_at (newest first)
  const sortedLeads = [...leads].sort((a, b) => {
    const aIsUnread = !a.viewed_at
    const bIsUnread = !b.viewed_at
    
    // Unread leads come first
    if (aIsUnread && !bIsUnread) return -1
    if (!aIsUnread && bIsUnread) return 1
    
    // Within same read status, sort by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="p-4 space-y-2">
      {sortedLeads.map((lead) => (
        <LeadListItem
          key={lead.id}
          lead={lead}
          isSelected={selectedLeadId === lead.id}
          onClick={() => onSelectLead(lead.id)}
        />
      ))}
    </div>
  )
}
