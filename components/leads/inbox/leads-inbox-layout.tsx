'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LeadsFiltersPanel } from './leads-filters-panel'
import { LeadsListPanel } from './leads-list-panel'
import { LeadDetailPanel } from './lead-detail-panel'

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
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
}

interface LeadsInboxLayoutProps {
  leads: Lead[]
}

export function LeadsInboxLayout({ leads }: LeadsInboxLayoutProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'new' | 'at-risk' | 'engaged' | 'booked' | 'lost' | 'dnc'>('new')
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    service: '',
    score: '',
    lastTouch: '',
    tags: [] as string[],
  })

  // Filter leads based on active view and filters
  const filteredLeads = leads.filter(lead => {
    // Apply view filter
    if (activeView === 'new' && lead.status !== 'new') return false
    if (activeView === 'at-risk') {
      const hoursSinceContact = lead.last_contacted_at
        ? (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60)
        : Infinity
      if (lead.score === 'hot' && hoursSinceContact < 24) return false
      if (lead.score === 'warm' && hoursSinceContact < 48) return false
      if (lead.score === 'cold') return false
    }
    if (activeView === 'engaged' && lead.status !== 'in_progress') return false
    if (activeView === 'booked' && lead.status !== 'booked') return false
    if (activeView === 'lost' && lead.status !== 'lost') return false
    if (activeView === 'dnc' && lead.status !== 'dnc') return false

    // Apply additional filters
    if (filters.status && lead.status !== filters.status) return false
    if (filters.source && lead.source !== filters.source) return false
    if (filters.service && lead.interested_in_service_name !== filters.service) return false
    if (filters.score && lead.score !== filters.score) return false

    return true
  })

  const selectedLead = selectedLeadId ? filteredLeads.find(l => l.id === selectedLeadId) : null

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel: Filters */}
      <div className="hidden lg:block w-64 flex-shrink-0 border-r border-zinc-200/50 dark:border-white/10 overflow-y-auto">
        <LeadsFiltersPanel
          activeView={activeView}
          onViewChange={setActiveView}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Center Panel: Lead List */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <LeadsListPanel
          leads={filteredLeads}
          selectedLeadId={selectedLeadId}
          onSelectLead={setSelectedLeadId}
        />
      </div>

      {/* Right Panel: Lead Detail */}
      <div className={cn(
        "hidden xl:block w-96 flex-shrink-0 border-l border-zinc-200/50 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out",
        selectedLead 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full pointer-events-none w-0"
      )}>
        {selectedLead && (
          <div className="h-full animate-in slide-in-from-right duration-300">
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile: Detail as Modal/Drawer */}
      {selectedLead && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl animate-in slide-in-from-right duration-300">
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
