'use client'

import { Phone, Mail, Calendar } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  created_at: string
  last_contacted_at: string | null
  status: string
  score: string
  follow_up_count?: number
  next_follow_up_date?: string | null
  reminder_sent?: boolean | null
}

type TabType = 'new' | 'incomplete' | 'following-up' | 'booked' | 'not-interested'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getScoreBarClass(score: string, type: TabType): string {
  if (type === 'booked') return 'bg-[var(--dash-green)]'
  if (type === 'not-interested') return 'bg-[var(--dash-border-bright)]'
  if (score === 'hot') return 'bg-[var(--dash-red)] shadow-[0_0_6px_var(--dash-red)]'
  if (score === 'warm') return 'bg-[var(--dash-amber)]'
  return 'bg-[var(--dash-border-bright)]'
}

function getScoreBadgeClass(score: string, type: TabType): string {
  if (type === 'booked') return 'bg-[var(--dash-green)]/20 text-[var(--dash-green)] border-[var(--dash-green)]'
  if (type === 'not-interested') return 'bg-[var(--dash-border-bright)]/20 text-[var(--dash-text-dim)] border-[var(--dash-border-bright)]'
  if (score === 'hot') return 'bg-[var(--dash-red)]/20 text-[var(--dash-red)] border-[var(--dash-red)]'
  if (score === 'warm') return 'bg-[var(--dash-amber)]/20 text-[var(--dash-amber)] border-[var(--dash-amber)]'
  return 'bg-[var(--dash-border-bright)]/20 text-[var(--dash-text-muted)] border-[var(--dash-border-bright)]'
}

function getScoreLabel(score: string): string {
  if (score === 'hot') return 'Hot'
  if (score === 'warm') return 'Warm'
  if (score === 'cold') return 'Cold'
  return '—'
}

function buildScoreTooltip(lead: Lead): string {
  const parts: string[] = []
  if (lead.estimated_value != null && lead.estimated_value >= 1000) parts.push('High value')
  else if (lead.estimated_value != null && lead.estimated_value >= 100) parts.push('Has estimated value')
  const daysSince = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)
  if (daysSince <= 1) parts.push('Recent')
  else if (daysSince <= 7) parts.push('Created this week')
  if (lead.last_contacted_at) {
    const hours = Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000)
    if (hours < 24) parts.push(`Contacted ${hours}h ago`)
    else parts.push('Contacted recently')
  }
  const followUp = lead.follow_up_count ?? 0
  if (followUp >= 2) parts.push('Multiple follow-ups')
  else if (followUp === 1) parts.push('One follow-up')
  if (lead.email && lead.phone) parts.push('Has email & phone')
  else if (lead.email || lead.phone) parts.push('Has contact info')
  return parts.length ? parts.join(' · ') : 'No factors'
}

const EMPTY_MESSAGES: Record<TabType, string> = {
  'new': 'No new leads yet',
  'incomplete': 'No hot leads — great job!',
  'following-up': 'No follow-ups needed',
  'booked': 'No bookings yet',
  'not-interested': 'No lost leads',
}

export default function BookingList({
  leads,
  type,
  onLeadClick,
}: {
  leads: Lead[]
  type: TabType
  onLeadClick?: (lead: Lead) => void
}) {
  if (leads.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">
          {EMPTY_MESSAGES[type]}
        </div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
          Leads in this tab will appear here
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
      {leads.map((lead) => (
        <LeadRow
          key={lead.id}
          lead={lead}
          type={type}
          onLeadClick={onLeadClick}
        />
      ))}
    </div>
  )
}

function LeadRow({
  lead,
  type,
  onLeadClick,
}: {
  lead: Lead
  type: TabType
  onLeadClick?: (lead: Lead) => void
}) {
  const daysSince = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / 86400000
  )
  const hoursSinceContact = lead.last_contacted_at
    ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000)
    : null

  const metaLabel =
    type === 'new'
      ? daysSince === 0
        ? 'Today'
        : `${daysSince}d ago`
      : type === 'incomplete'
      ? daysSince === 0
        ? 'Started today'
        : `Started ${daysSince}d ago`
      : type === 'following-up' && hoursSinceContact != null
      ? `Contact ${hoursSinceContact}h ago`
      : type === 'booked'
      ? 'Booked'
      : type === 'not-interested'
      ? 'Lost'
      : hoursSinceContact != null
      ? `${hoursSinceContact}h ago`
      : 'Not contacted'

  const barClass = getScoreBarClass(lead.score, type)
  const scoreBadgeClass = getScoreBadgeClass(lead.score, type)
  const scoreLabel = getScoreLabel(lead.score)
  const tooltipText = buildScoreTooltip(lead)
  const today = new Date().toISOString().slice(0, 10)
  const needsFollowUp =
    lead.next_follow_up_date != null &&
    lead.next_follow_up_date <= today &&
    lead.reminder_sent !== true

  return (
    <div className="bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Status bar (subtle left accent) */}
        <div className={cn('w-0.5 h-10 rounded-sm flex-shrink-0', barClass)} />

        {/* Avatar */}
        <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-[var(--dash-surface)] border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-sm text-[var(--dash-text-dim)]">
          {lead.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + service + meta */}
        <div className="flex-1 min-w-0">
          <div className="font-dash-condensed font-bold text-[16px] text-[var(--dash-text)] truncate">
            {lead.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'inline-flex items-center font-dash-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                      scoreBadgeClass
                    )}
                  >
                    {scoreLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {needsFollowUp && (
              <span className="inline-flex items-center font-dash-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[var(--dash-amber)] bg-[var(--dash-amber)]/10 text-[var(--dash-amber)]">
                Needs Follow-up
              </span>
            )}
            {lead.interested_in_service_name && (
              <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] truncate max-w-[180px] sm:max-w-none">
                {lead.interested_in_service_name}
              </span>
            )}
            <span className="font-dash-mono text-[10px] text-[var(--dash-text-dim)]">
              {metaLabel}
            </span>
          </div>
        </div>

        {/* Revenue (desktop) */}
        {lead.estimated_value != null && lead.estimated_value > 0 && (
          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-amber)]">
              ${lead.estimated_value}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-green)] hover:bg-[var(--dash-green)]/10 rounded transition-colors"
              title="Call"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-blue)] hover:bg-[var(--dash-blue)]/10 rounded transition-colors"
              title="Email"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onLeadClick?.(lead)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 font-dash-condensed font-bold text-[11px] uppercase tracking-wider transition-opacity',
              type === 'booked'
                ? 'border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]'
                : 'bg-[var(--dash-amber)] text-[var(--dash-black)] hover:opacity-90'
            )}
          >
            <Calendar className="h-3 w-3" />
            {type === 'booked' ? 'View' : 'Schedule'}
          </button>
        </div>
      </div>

      {/* Mobile: revenue + extra meta */}
      <div className="sm:hidden flex items-center gap-4 px-4 pb-3 pl-[52px]">
        {lead.estimated_value != null && lead.estimated_value > 0 && (
          <span className="font-dash-mono text-[10px] text-[var(--dash-amber)]">
            ${lead.estimated_value}
          </span>
        )}
        {(lead.phone || lead.email) && (
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            {lead.phone || lead.email}
          </span>
        )}
      </div>
    </div>
  )
}
