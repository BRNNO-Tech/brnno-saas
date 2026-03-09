'use client'

import { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { LeadSlideOut } from '@/components/leads/inbox/lead-slide-out'
import { LeadsInboxLayout } from '@/components/leads/inbox/leads-inbox-layout'
import BookingList from '@/components/bookings/booking-list'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Phone, Zap } from 'lucide-react'
import Link from 'next/link'

type SortOption = 'newest' | 'oldest' | 'highest_value' | 'score'
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest_value', label: 'Highest Value' },
  { value: 'score', label: 'Score (Hot first)' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'lost', label: 'Lost' },
]

const SCORE_FILTER_OPTIONS = [
  { value: 'all', label: 'All scores' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  created_at: string
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

interface LeadsRecoveryCommandCenterProps {
  allLeads: Lead[]
  newLeads: Lead[]
  incompleteLeads: Lead[]
  followingUpLeads: Lead[]
  bookedLeads: Lead[]
  notInterestedLeads: Lead[]
  needsActionLeads: Lead[]
  overviewStats: {
    recoveredRevenue: number
    bookingsFromRecovery: number
    atRiskLeads: number
  }
  leadLimitInfo: { canAdd: boolean }
  maxLeads: number
  canUseAutomation: boolean
  canUseInbox?: boolean
}

const TABS = [
  { key: 'new', label: 'New' },
  { key: 'incomplete', label: 'Hot' },
  { key: 'following-up', label: 'Warm' },
  { key: 'booked', label: 'Booked' },
  { key: 'not-interested', label: 'Lost' },
] as const

type TabKey = (typeof TABS)[number]['key']

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function LeadsRecoveryCommandCenter({
  allLeads,
  newLeads,
  incompleteLeads,
  followingUpLeads,
  bookedLeads,
  notInterestedLeads,
  needsActionLeads,
  overviewStats,
  leadLimitInfo,
  maxLeads,
  canUseAutomation,
  canUseInbox = false,
}: LeadsRecoveryCommandCenterProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [inboxSelectedLeadId, setInboxSelectedLeadId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('incomplete')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')

  const tabLeads: Record<TabKey, Lead[]> = {
    new: newLeads,
    incomplete: incompleteLeads,
    'following-up': followingUpLeads,
    booked: bookedLeads,
    'not-interested': notInterestedLeads,
  }

  const filteredAndSortedLeads = useMemo(() => {
    let list = tabLeads[activeTab] ?? []
    if (statusFilter !== 'all') list = list.filter((l) => l.status === statusFilter)
    if (scoreFilter !== 'all') list = list.filter((l) => (l.score || '').toLowerCase() === scoreFilter.toLowerCase())
    const scoreOrder = { hot: 3, warm: 2, cold: 1 }
    if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === 'highest_value') list = [...list].sort((a, b) => (b.estimated_value ?? -1) - (a.estimated_value ?? -1))
    else if (sortBy === 'score') list = [...list].sort((a, b) => (scoreOrder[(b.score as keyof typeof scoreOrder)] ?? 0) - (scoreOrder[(a.score as keyof typeof scoreOrder)] ?? 0))
    return list
  }, [activeTab, tabLeads, statusFilter, scoreFilter, sortBy])

  const handleLeadClick = (lead: any) => {
    const convertedLead: Lead = {
      ...lead,
      score: (['hot', 'warm', 'cold'].includes(lead.score) ? lead.score : 'cold') as Lead['score'],
    }
    setSelectedLead(convertedLead)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setSelectedLead(null)
  }

  return (
    <>
      <div className="space-y-6">

        {/* Lead limit warning */}
        {!leadLimitInfo.canAdd && (
          <div className="flex items-center justify-between px-4 py-3 border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-[var(--dash-amber)] flex-shrink-0" />
              <div>
                <span className="font-dash-condensed font-bold text-[13px] uppercase tracking-wide text-[var(--dash-amber)]">
                  Lead Limit Reached
                </span>
                <span className="ml-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  {maxLeads} leads max this month
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings/subscription"
              className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider px-2.5 py-1.5 border border-[var(--dash-amber)]/50 text-[var(--dash-amber)] hover:bg-[var(--dash-amber)] hover:text-[var(--dash-black)] transition-colors"
            >
              Upgrade →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-green)]">
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Recovered</div>
            <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-green)] tracking-tight mb-2">
              ${overviewStats.recoveredRevenue.toLocaleString()}
            </div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              {overviewStats.bookingsFromRecovery} booking{overviewStats.bookingsFromRecovery !== 1 ? 's' : ''} this month
            </div>
          </div>

          <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-red)]">
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Needs Action</div>
            <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-red)] tracking-tight mb-2">
              {needsActionLeads.length}
            </div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Follow up ASAP</div>
          </div>

          <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-[var(--dash-blue)]">
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">Booked</div>
            <div className="font-dash-condensed font-extrabold text-4xl leading-none text-[var(--dash-blue)] tracking-tight mb-2">
              {bookedLeads.length}
            </div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Total successful</div>
          </div>
        </div>

        {/* Needs action panel */}
        {needsActionLeads.length > 0 && (
          <div className="border border-[var(--dash-red)]/30 bg-[var(--dash-red)]/8">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--dash-red)]/20">
              <div className="h-2 w-2 rounded-full bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]" />
              <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-red)]">
                {needsActionLeads.length} Lead{needsActionLeads.length !== 1 ? 's' : ''} Need Attention
              </span>
              <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">— interested but not booked</span>
            </div>

            <div className="divide-y divide-[var(--dash-red)]/10">
              {needsActionLeads.slice(0, 3).map((lead: any) => {
                const hoursSince = lead.last_contacted_at
                  ? Math.round((Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000)
                  : null

                return (
                  <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full flex-shrink-0',
                      lead.score === 'hot' ? 'bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]' : 'bg-[var(--dash-amber)]'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-text)] truncate">{lead.name}</div>
                      <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
                        {hoursSince !== null ? `Last contact: ${hoursSince}h ago` : 'Not contacted yet'}
                        {lead.interested_in_service_name && ` · ${lead.interested_in_service_name}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[11px] uppercase tracking-wide text-[var(--dash-text-muted)] hover:border-[var(--dash-green)] hover:text-[var(--dash-green)] transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      )}
                      <button
                        onClick={() => canUseInbox ? setInboxSelectedLeadId(lead.id) : handleLeadClick(lead)}
                        className="px-2.5 py-1.5 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase tracking-wide hover:opacity-90 transition-opacity"
                      >
                        View
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {needsActionLeads.length > 3 && (
              <div className="px-4 py-2.5 border-t border-[var(--dash-red)]/20">
                <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  +{needsActionLeads.length - 3} more need attention
                </span>
              </div>
            )}
          </div>
        )}

        {/* Auto follow-up link */}
        {canUseAutomation && (
          <div className="flex items-center justify-between px-4 py-3 border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-[var(--dash-amber)]" />
              <span className="font-dash-condensed font-bold text-sm uppercase tracking-wide text-[var(--dash-text)]">Auto Follow-Up</span>
              <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">— automate your lead sequences</span>
            </div>
            <Link
              href="/dashboard/leads/sequences"
              className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider px-2.5 py-1.5 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
            >
              Manage →
            </Link>
          </div>
        )}

        {/* Main content */}
        {canUseInbox ? (
          <LeadsInboxLayout
            leads={allLeads as any}
            selectedLeadId={inboxSelectedLeadId}
            onSelectedLeadIdChange={setInboxSelectedLeadId}
          />
        ) : (
          <div>
            {/* Tab bar */}
            <div className="flex border border-[var(--dash-border)] bg-[var(--dash-border)] gap-px mb-4">
              {TABS.map(tab => {
                const count = tabLeads[tab.key].length
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider transition-colors',
                      activeTab === tab.key
                        ? 'bg-[var(--dash-graphite)] text-[var(--dash-amber)]'
                        : 'bg-[var(--dash-surface)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text-dim)]'
                    )}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        'font-dash-mono text-[10px] px-1.5 py-0.5 border',
                        activeTab === tab.key
                          ? 'border-[var(--dash-amber)]/40 text-[var(--dash-amber)] bg-[var(--dash-amber-glow)]'
                          : 'border-[var(--dash-border-bright)] text-[var(--dash-text-muted)]'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Sort and filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px] h-9 font-dash-mono text-[11px] border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-dash-mono text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 font-dash-mono text-[11px] border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-dash-mono text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[120px] h-9 font-dash-mono text-[11px] border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)]">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-dash-mono text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredAndSortedLeads.length === 0 && (statusFilter !== 'all' || scoreFilter !== 'all') ? (
              <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
                <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)]">
                  No leads match filters
                </div>
                <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
                  Try changing the status or score filter
                </div>
              </div>
            ) : (
              <BookingList
                leads={filteredAndSortedLeads as any}
                type={activeTab as any}
                onLeadClick={handleLeadClick}
              />
            )}
          </div>
        )}
      </div>

      {!canUseInbox && (
        <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) handleCloseSheet() }}>
          <SheetContent side="right" className="w-full sm:w-[28rem] lg:w-[32rem] max-w-[100vw] p-0 [&>button]:hidden">
            <SheetTitle className="sr-only">
              {selectedLead ? `Lead Details - ${selectedLead.name}` : 'Lead Details'}
            </SheetTitle>
            {selectedLead && (
              <LeadSlideOut lead={selectedLead} onClose={handleCloseSheet} />
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
