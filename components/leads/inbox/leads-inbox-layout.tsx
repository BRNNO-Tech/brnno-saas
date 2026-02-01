'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { LeadsList } from './leads-list'
import { LeadSlideOut } from './lead-slide-out'
import { markLeadAsRead } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'
import { getDisplayStatus, type DisplayStatus } from './leads-inbox-utils'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_id: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  notes: string | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  viewed_at: string | null
  job_id: string | null
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
  const [activeDisplayStatus, setActiveDisplayStatus] = useState<DisplayStatus>('new')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const router = useRouter()
  const processedLeadsRef = useRef<Set<string>>(new Set())

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedLeadId(null)
  }, [activeDisplayStatus])

  // Counts per display status
  const counts = useMemo(() => {
    const c: Record<DisplayStatus, number> = {
      new: 0,
      followup: 0,
      warm: 0,
      hot: 0,
      booked: 0,
      cold: 0,
    }
    leads.forEach((l) => {
      const s = getDisplayStatus(l)
      c[s] += 1
    })
    return c
  }, [leads])

  // Filter by active tab + search, sort by last activity
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads
      .filter((l) => getDisplayStatus(l) === activeDisplayStatus)
      .filter((l) => {
        if (!q) return true
        return (
          l.name.toLowerCase().includes(q) ||
          (l.phone ?? '').toLowerCase().includes(q) ||
          (l.interested_in_service_name ?? '').toLowerCase().includes(q) ||
          (l.source ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const aAt = a.last_contacted_at ?? a.created_at
        const bAt = b.last_contacted_at ?? b.created_at
        return new Date(bAt).getTime() - new Date(aAt).getTime()
      })
  }, [leads, activeDisplayStatus, search])

  const selectedLead = selectedLeadId
    ? leads.find((l) => l.id === selectedLeadId) ?? null
    : null

  // Mark lead as read when selected
  useEffect(() => {
    if (!selectedLeadId) return
    if (processedLeadsRef.current.has(selectedLeadId)) return
    const lead = filteredLeads.find((l) => l.id === selectedLeadId)
    if (!lead) return
    if (lead.viewed_at) {
      processedLeadsRef.current.add(selectedLeadId)
      return
    }
    processedLeadsRef.current.add(selectedLeadId)
    markLeadAsRead(selectedLeadId)
      .then(() => router.refresh())
      .catch((error) => {
        console.error('Error marking lead as read:', error)
        processedLeadsRef.current.delete(selectedLeadId)
      })
  }, [selectedLeadId, filteredLeads, router])

  const handleLeadDeleted = (deletedLeadId: string) => {
    if (selectedLeadId === deletedLeadId) setSelectedLeadId(null)
    router.refresh()
  }

  const displayStatuses: DisplayStatus[] = ['new', 'followup', 'warm', 'hot', 'booked', 'cold']
  const tabLabels: Record<DisplayStatus, string> = {
    new: 'New',
    followup: 'Follow-Up',
    warm: 'Warm',
    hot: 'Hot',
    booked: 'Booked',
    cold: 'Cold',
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Column: Search + Tabs + List */}
      <div className="flex w-[28rem] flex-shrink-0 flex-col overflow-hidden border-r border-zinc-200/50 dark:border-white/10">
        {/* Search + Panel Toggle */}
        <div className="flex items-center gap-2 border-b border-zinc-200/50 dark:border-white/10 p-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads, phone, service, source…"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:border-white/10 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            {panelOpen ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>

        {/* 6 Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200/50 dark:border-white/10 p-2">
          {displayStatuses.map((s) => {
            const active = activeDisplayStatus === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveDisplayStatus(s)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
                  active
                    ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                    : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/5'
                )}
              >
                {tabLabels[s]}{' '}
                <span className={active ? 'text-white/90 dark:text-zinc-900/90' : 'text-zinc-500 dark:text-zinc-400'}>
                  ({counts[s]})
                </span>
              </button>
            )
          })}
        </div>

        {/* List header */}
        <div className="flex items-center justify-between px-4 py-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-white">
            {tabLabels[activeDisplayStatus]} Leads
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{filteredLeads.length} shown</span>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto">
          <LeadsList
            leads={filteredLeads}
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
          />
        </div>
      </div>

      {/* Right Column: Placeholder or Slide-out */}
      {panelOpen && (
        <div
          className={cn(
            'hidden xl:block w-[32rem] flex-shrink-0 border-l border-zinc-200/50 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out',
            selectedLead ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-0'
          )}
        >
          {selectedLead ? (
            <LeadSlideOut
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
              onDelete={handleLeadDeleted}
            />
          ) : (
            <div className="flex h-full flex-col justify-center rounded-3xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-white/10">
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Lead Panel</div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Select a lead to open the slide-out panel. This space can later become a map, schedule preview, or daily route.
              </div>
              <div className="mt-6 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-white/10">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">Why this layout works</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>Lead rows show service, value, and recency at a glance.</li>
                  <li>Slide-out is action-first: Call → Text → Schedule.</li>
                  <li>Snapshot removes guesswork without becoming a CRM.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Slide-out as Modal */}
      {selectedLead && (
        <div className="xl:hidden fixed inset-0 z-50 animate-in fade-in duration-200 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-right duration-300 bg-white shadow-xl dark:bg-zinc-900">
            <LeadSlideOut
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
              onDelete={handleLeadDeleted}
            />
          </div>
        </div>
      )}
    </div>
  )
}
