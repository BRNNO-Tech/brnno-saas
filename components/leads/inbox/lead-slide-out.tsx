'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Phone, Mail, MessageSquare, Loader2, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateLeadStatus, addLeadInteraction, deleteLead, getLead } from '@/lib/actions/leads'
import { setFollowUpReminder } from '@/lib/actions/lead-reminders'
import { LeadTimeline } from './lead-timeline'
import { LeadBookingTab } from './lead-booking-tab'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  getDisplayStatus,
  displayStatusToDbStatus,
  nextActionHint,
  serviceEstTimeFallback,
  formatMoney,
  STATUS_LABEL,
  QUICK_TEXTS,
  type DisplayStatus,
} from './leads-inbox-utils'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source?: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  created_at: string
  job_id: string | null
  next_follow_up_date?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  asset_details?: {
    year?: string
    make?: string
    model?: string
    size?: string
    color?: string
  } | null
  vehicle_type?: string | null
  vehicle_color?: string | null
  vehicle_condition?: string | null
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
}

interface LeadSlideOutProps {
  lead: Lead
  onClose: () => void
  onDelete?: (leadId: string) => void
}

const DASH_STATUS_BADGE: Record<DisplayStatus, string> = {
  new: 'text-[var(--dash-blue)] border-[var(--dash-blue)]/40',
  followup: 'text-[var(--dash-blue)] border-[var(--dash-blue)]/40',
  warm: 'text-[var(--dash-amber)] border-[var(--dash-amber)]/40',
  hot: 'text-[var(--dash-red)] border-[var(--dash-red)]/40',
  booked: 'text-[var(--dash-green)] border-[var(--dash-green)]/40',
  cold: 'text-[var(--dash-text-muted)] border-[var(--dash-border-bright)]',
}

export function LeadSlideOut({ lead, onClose, onDelete }: LeadSlideOutProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [fullLead, setFullLead] = useState<Lead | null>(lead)
  const [loading, setLoading] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [savingReminder, setSavingReminder] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const smsTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function loadFullLead() {
      setLoading(true)
      try {
        const fullLeadData = await getLead(lead.id)
        setFullLead(fullLeadData as Lead)
      } catch (error) {
        console.error('Error loading lead:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFullLead()
  }, [lead.id])

  const displayStatus = getDisplayStatus(fullLead ?? lead)
  const hint = nextActionHint(fullLead ?? lead)
  const estTime = serviceEstTimeFallback(fullLead?.interested_in_service_name ?? lead.interested_in_service_name)

  const handleMarkNotInterested = async () => {
    try {
      await updateLeadStatus(lead.id, 'lost')
      const updatedLead = await getLead(lead.id)
      setFullLead(updatedLead as Lead)
      toast.success('Marked as not interested')
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${lead.name}"? This action cannot be undone.`)) return
    try {
      await deleteLead(lead.id)
      toast.success('Lead deleted')
      onDelete?.(lead.id)
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const handleSendSMS = async () => {
    if (!message.trim() || !lead.phone) return
    setSending(true)
    try {
      await addLeadInteraction(lead.id, 'sms', message)
      setMessage('')
      toast.success('SMS sent!')
      const updatedLead = await getLead(lead.id)
      setFullLead(updatedLead as Lead)
      router.refresh()
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (display: DisplayStatus) => {
    const dbStatus = displayStatusToDbStatus(display)
    try {
      await updateLeadStatus(lead.id, dbStatus)
      const updatedLead = await getLead(lead.id)
      setFullLead(updatedLead as Lead)
      toast.success('Status updated')
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update')
    }
  }

  const handleSetFollowUpReminder = async () => {
    const date = reminderDate.trim()
    if (!date) {
      toast.error('Please select a date')
      return
    }
    setSavingReminder(true)
    try {
      await setFollowUpReminder(lead.id, date)
      const updatedLead = await getLead(lead.id)
      setFullLead(updatedLead as Lead)
      setReminderDate('')
      toast.success('Follow-up reminder set')
      router.refresh()
    } catch (error) {
      console.error('Error setting follow-up reminder:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set reminder')
    } finally {
      setSavingReminder(false)
    }
  }

  const scrollToSmsComposer = () => {
    const scrollEl = scrollContainerRef.current
    const textareaEl = smsTextareaRef.current
    if (!scrollEl || !textareaEl) return
    const composer = textareaEl.closest('[id="sms-composer"]') as HTMLElement | null
    if (composer && scrollEl.contains(composer)) {
      const composerRect = composer.getBoundingClientRect()
      const scrollRect = scrollEl.getBoundingClientRect()
      const top = scrollEl.scrollTop + (composerRect.top - scrollRect.top) - 16
      scrollEl.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
    setTimeout(() => textareaEl.focus(), 350)
  }

  const addQuickText = (kind: keyof typeof QUICK_TEXTS) => {
    const firstName = (fullLead?.name ?? lead.name).split(' ')[0] || (fullLead?.name ?? lead.name)
    const text = QUICK_TEXTS[kind](firstName)
    setMessage((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  const displayStatuses: DisplayStatus[] = ['new', 'followup', 'warm', 'hot', 'booked', 'cold']

  return (
    <div className="flex h-full max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--dash-surface)] text-[var(--dash-text)]">
      {/* Fixed header: name + close */}
      <div className="flex-shrink-0 border-b border-[var(--dash-border)] px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-dash-condensed font-bold text-xl text-[var(--dash-text)] truncate">
              {fullLead?.name ?? lead.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 hover:text-[var(--dash-green)] transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 hover:text-[var(--dash-blue)] transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn('font-dash-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider', DASH_STATUS_BADGE[displayStatus])}>
                {STATUS_LABEL[displayStatus]}
              </span>
              {(fullLead?.interested_in_service_name ?? lead.interested_in_service_name) && (
                <span className="font-dash-mono text-[10px] px-2 py-0.5 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)]">
                  {fullLead?.interested_in_service_name ?? lead.interested_in_service_name}
                </span>
              )}
              {(fullLead?.estimated_value ?? lead.estimated_value) != null && (
                <span className="font-dash-mono text-[10px] px-2 py-0.5 border border-[var(--dash-amber)]/40 text-[var(--dash-amber)]">
                  {formatMoney(fullLead?.estimated_value ?? lead.estimated_value ?? 0)}
                </span>
              )}
            </div>
            {(fullLead?.source ?? lead.source) && (
              <div className="mt-2 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
                Source: {fullLead?.source ?? lead.source}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable body: actions, schedule, snapshot, timeline, SMS */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
      {/* Actions */}
      <div className="space-y-2 px-4 sm:px-5 py-4 border-b border-[var(--dash-border)]">
        <div className="grid grid-cols-2 gap-2">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center justify-center gap-2 py-2 bg-[var(--dash-green)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity rounded"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ) : (
            <span className="flex items-center justify-center gap-2 py-2 border border-[var(--dash-border)] font-dash-mono text-[10px] text-[var(--dash-text-muted)] rounded opacity-60">
              <Phone className="h-3.5 w-3.5" /> Call
            </span>
          )}
          <button
            type="button"
            disabled={!lead.phone}
            onClick={scrollToSmsComposer}
            className="flex items-center justify-center gap-2 py-2 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors rounded disabled:opacity-50"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Text
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleMarkNotInterested}
            className="py-2 border border-[var(--dash-red)]/40 font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 transition-colors rounded"
          >
            Not Interested
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-2 border border-[var(--dash-red)]/40 font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 transition-colors rounded flex items-center justify-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
        {/* Schedule job */}
        <div className="pt-3 mt-3 border-t border-[var(--dash-border)]">
          <LeadBookingTab
            leadId={lead.id}
            leadName={lead.name}
            leadEmail={fullLead?.email ?? lead.email ?? null}
            leadPhone={fullLead?.phone ?? lead.phone ?? null}
            interestedInServiceName={fullLead?.interested_in_service_name ?? lead.interested_in_service_name ?? null}
            estimatedValue={fullLead?.estimated_value ?? lead.estimated_value ?? null}
          />
        </div>
        {/* Set Follow-up Reminder */}
        <div className="pt-3 mt-3 border-t border-[var(--dash-border)]">
          <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Set Follow-up Reminder</div>
          {(fullLead?.next_follow_up_date ?? lead.next_follow_up_date) && (
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-dim)] mb-2">
              Current: {(fullLead?.next_follow_up_date ?? lead.next_follow_up_date)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="flex-1 min-w-0 h-9 px-2 border border-[var(--dash-border)] bg-[var(--dash-graphite)] font-dash-mono text-[11px] text-[var(--dash-text)] rounded"
            />
            <button
              type="button"
              onClick={handleSetFollowUpReminder}
              disabled={savingReminder || !reminderDate.trim()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
            >
              {savingReminder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Content: Snapshot, Next Action, Timeline */}
      <div className="px-4 sm:px-5 py-4">
        {/* Lead Snapshot */}
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
          <div className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Lead Snapshot</div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-dash-mono text-[11px]">
            <div className="text-[var(--dash-text-muted)]">Service</div>
            <div className="font-medium text-[var(--dash-text)]">
              {fullLead?.interested_in_service_name ?? lead.interested_in_service_name ?? '—'}
            </div>
            <div className="text-[var(--dash-text-muted)]">Est. Revenue</div>
            <div className="font-medium text-[var(--dash-amber)]">
              {formatMoney(fullLead?.estimated_value ?? lead.estimated_value ?? 0)}
            </div>
            <div className="text-[var(--dash-text-muted)]">Est. Time</div>
            <div className="font-medium text-[var(--dash-text)]">{estTime}</div>
            <div className="text-[var(--dash-text-muted)]">Vehicle</div>
            <div className="font-medium text-[var(--dash-text)]">
              {fullLead?.asset_details?.make
                ? `${fullLead.asset_details.year ?? ''} ${fullLead.asset_details.make} ${fullLead.asset_details.model ?? ''}`.trim()
                : fullLead?.vehicle_type
                  ? fullLead.vehicle_type
                  : (fullLead as { ai_vehicle_size?: string } | null)?.ai_vehicle_size ?? 'Not provided'}
            </div>
            <div className="text-[var(--dash-text-muted)]">Address</div>
            <div className="font-medium text-[var(--dash-text)]">
              {fullLead?.address
                ? [fullLead.address, fullLead.city, fullLead.state, fullLead.zip].filter(Boolean).join(', ')
                : 'Not provided'}
            </div>
          </div>
        </div>

        {/* Next Action */}
        {hint && (
          <div className="mt-4 border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
            <div className="flex items-center gap-2 font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">
              <Sparkles className="h-4 w-4 text-[var(--dash-amber)]" />
              Next Action
            </div>
            <div className="mt-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">{hint}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {displayStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleUpdateStatus(s)}
                  className={cn(
                    'font-dash-mono text-[10px] px-2.5 py-1 border uppercase tracking-wider transition-colors rounded',
                    displayStatus === s
                      ? 'bg-[var(--dash-amber)] text-[var(--dash-black)] border-[var(--dash-amber)]'
                      : 'border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)]/50 hover:text-[var(--dash-text-dim)]'
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity / Timeline */}
        <div className="mt-4 border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
          <div className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Activity</div>
          {loading ? (
            <div className="py-8 text-center font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Loading...</div>
          ) : (
            <div className="mt-3">
              <LeadTimeline
                leadId={lead.id}
                leadCreatedAt={fullLead?.created_at ?? lead.created_at}
                interactions={fullLead?.interactions ?? lead.interactions ?? []}
                status={fullLead?.status ?? lead.status}
                lastContactedAt={fullLead?.last_contacted_at ?? lead.last_contacted_at}
              />
            </div>
          )}
        </div>

        <div className="h-24" />
      </div>

      {/* SMS Composer */}
      {lead.phone && (
        <div
          id="sms-composer"
          className="border-t border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 sm:px-5 py-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text)]">Quick Text Reply</div>
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">SMS</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addQuickText('intro')}
              className="font-dash-mono text-[10px] px-2.5 py-1 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)]/50 hover:text-[var(--dash-text)] transition-colors rounded"
            >
              Intro
            </button>
            <button
              type="button"
              onClick={() => addQuickText('availability')}
              className="font-dash-mono text-[10px] px-2.5 py-1 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)]/50 hover:text-[var(--dash-text)] transition-colors rounded"
            >
              Availability
            </button>
            <button
              type="button"
              onClick={() => addQuickText('bookNow')}
              className="font-dash-mono text-[10px] px-2.5 py-1 border border-[var(--dash-border-bright)] text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)]/50 hover:text-[var(--dash-text)] transition-colors rounded"
            >
              Book Now
            </button>
          </div>
          <textarea
            ref={smsTextareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quick reply to book this job…"
            className="mt-3 h-24 w-full resize-none border border-[var(--dash-border)] bg-[var(--dash-surface)] p-3 font-dash-mono text-[12px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:border-[var(--dash-amber)]/50 rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSendSMS()
              }
            }}
          />
          <button
            type="button"
            disabled={!message.trim() || sending}
            onClick={handleSendSMS}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity rounded disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Send SMS
              </>
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
