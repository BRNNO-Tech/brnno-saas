'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { LeadsList } from './leads-list'
import { LeadSlideOut } from './lead-slide-out'
import { markLeadAsRead } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'
import { getDisplayStatus, type DisplayStatus } from './leads-inbox-utils'
import { Search, X } from 'lucide-react'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

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
  selectedLeadId?: string | null
  onSelectedLeadIdChange?: (id: string | null) => void
}

const DISPLAY_STATUSES: DisplayStatus[] = ['new', 'followup', 'warm', 'hot', 'booked', 'cold']

const TAB_LABELS: Record<DisplayStatus, string> = {
  new: 'New',
  followup: 'Follow-Up',
  warm: 'Warm',
  hot: 'Hot',
  booked: 'Booked',
  cold: 'Cold',
}

const TAB_COLORS: Record<DisplayStatus, { active: string; dot: string }> = {
  new: { active: 'text-[var(--dash-blue)] border-[var(--dash-blue)]/40 bg-[var(--dash-blue)]/8', dot: 'bg-[var(--dash-blue)]' },
  followup: { active: 'text-[var(--dash-amber)] border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)]', dot: 'bg-[var(--dash-amber)]' },
  warm: { active: 'text-[var(--dash-amber)] border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)]', dot: 'bg-[var(--dash-amber)]' },
  hot: { active: 'text-[var(--dash-red)] border-[var(--dash-red)]/40 bg-[var(--dash-red)]/8', dot: 'bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]' },
  booked: { active: 'text-[var(--dash-green)] border-[var(--dash-green)]/40 bg-[var(--dash-green)]/8', dot: 'bg-[var(--dash-green)]' },
  cold: { active: 'text-[var(--dash-text-muted)] border-[var(--dash-border-bright)]', dot: 'bg-[var(--dash-text-muted)]' },
}

export function LeadsInboxLayout({ leads, selectedLeadId: selectedLeadIdProp, onSelectedLeadIdChange }: LeadsInboxLayoutProps) {
  const [internalSelectedLeadId, setInternalSelectedLeadId] = useState<string | null>(null)
  const [activeDisplayStatus, setActiveDisplayStatus] = useState<DisplayStatus>('new')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const processedLeadsRef = useRef<Set<string>>(new Set())
  const skipClearOnTabChangeRef = useRef(false)

  const isControlled = onSelectedLeadIdChange !== undefined
  const selectedLeadId = isControlled ? (selectedLeadIdProp ?? null) : internalSelectedLeadId

  const setSelectedLeadId = (id: string | null) => {
    if (isControlled) onSelectedLeadIdChange?.(id)
    else setInternalSelectedLeadId(id)
  }

  useEffect(() => {
    if (!isControlled || selectedLeadId == null) return
    const lead = leads.find((l) => l.id === selectedLeadId)
    if (lead) {
      skipClearOnTabChangeRef.current = true
      setActiveDisplayStatus(getDisplayStatus(lead))
    }
  }, [isControlled, selectedLeadId, leads])

  useEffect(() => {
    if (skipClearOnTabChangeRef.current) {
      skipClearOnTabChangeRef.current = false
      return
    }
    setSelectedLeadId(null)
  }, [activeDisplayStatus])

  const counts = useMemo(() => {
    const c: Record<DisplayStatus, number> = { new: 0, followup: 0, warm: 0, hot: 0, booked: 0, cold: 0 }
    leads.forEach((l) => { c[getDisplayStatus(l)] += 1 })
    return c
  }, [leads])

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

  const selectedLead = selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ?? null : null

  useEffect(() => {
    if (!selectedLeadId) return
    if (processedLeadsRef.current.has(selectedLeadId)) return
    const lead = filteredLeads.find((l) => l.id === selectedLeadId)
    if (!lead) return
    if (lead.viewed_at) { processedLeadsRef.current.add(selectedLeadId); return }
    processedLeadsRef.current.add(selectedLeadId)
    markLeadAsRead(selectedLeadId).then(() => router.refresh()).catch(() => {
      processedLeadsRef.current.delete(selectedLeadId)
    })
  }, [selectedLeadId, filteredLeads, router])

  const handleLeadDeleted = (deletedLeadId: string) => {
    if (selectedLeadId === deletedLeadId) setSelectedLeadId(null)
    router.refresh()
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">

      {/* Left: List panel */}
      <div className="flex w-full xl:w-[26rem] flex-shrink-0 flex-col overflow-hidden bg-[var(--dash-graphite)]">

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--dash-border)]">
          <Search className="h-3.5 w-3.5 text-[var(--dash-text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads, phone, service…"
            className="flex-1 bg-transparent font-dash-mono text-[12px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-[var(--dash-border)]">
          {DISPLAY_STATUSES.map((s) => {
            const active = activeDisplayStatus === s
            const colors = TAB_COLORS[s]
            return (
              <button
                key={s}
                onClick={() => setActiveDisplayStatus(s)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 border font-dash-condensed font-bold text-[12px] uppercase tracking-wider transition-colors',
                  active
                    ? colors.active
                    : 'border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text-dim)]'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', active ? colors.dot : 'bg-[var(--dash-text-muted)]')} />
                {TAB_LABELS[s]}
                <span className={cn(
                  'font-dash-mono text-[10px]',
                  active ? '' : 'text-[var(--dash-text-muted)]'
                )}>
                  {counts[s]}
                </span>
              </button>
            )
          })}
        </div>

        {/* List header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--dash-border)]">
          <span className="font-dash-condensed font-bold text-[13px] uppercase tracking-wider text-[var(--dash-text)]">
            {TAB_LABELS[activeDisplayStatus]} Leads
          </span>
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            {filteredLeads.length} shown
          </span>
        </div>

        {/* Leads list */}
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No {TAB_LABELS[activeDisplayStatus].toLowerCase()} leads</div>
            </div>
          ) : (
            <LeadsList
              leads={filteredLeads}
              selectedLeadId={selectedLeadId}
              onSelectLead={setSelectedLeadId}
            />
          )}
        </div>
      </div>

      {/* Right: Detail panel (desktop only) */}
      <div className="hidden xl:flex flex-1 flex-col overflow-hidden bg-[var(--dash-graphite)]">
        {selectedLead ? (
          <LeadSlideOut
            lead={selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onDelete={handleLeadDeleted}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div className="h-px w-16 bg-[var(--dash-border-bright)]" />
            <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)]">
              Select a Lead
            </div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] max-w-xs">
              Pick a lead from the list to view details, send a message, or schedule a job.
            </div>
            <div className="h-px w-16 bg-[var(--dash-border-bright)]" />
          </div>
        )}
      </div>

      {/* Mobile: full screen slide-over */}
      {selectedLead && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--dash-graphite)] border-l border-[var(--dash-border)]">
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
