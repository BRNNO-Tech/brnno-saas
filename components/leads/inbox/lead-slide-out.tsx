'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Phone, Mail, MessageSquare, Calendar, Send, Loader2, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateLeadStatus, addLeadInteraction, convertLeadToClient, deleteLead, getLead } from '@/lib/actions/leads'
import { LeadTimeline } from './lead-timeline'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  getDisplayStatus,
  displayStatusToDbStatus,
  nextActionHint,
  serviceEstTimeFallback,
  formatMoney,
  STATUS_LABEL,
  STATUS_PILL_CLASS,
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

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        className
      )}
    >
      {children}
    </span>
  )
}

export function LeadSlideOut({ lead, onClose, onDelete }: LeadSlideOutProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [fullLead, setFullLead] = useState<Lead | null>(lead)
  const [loading, setLoading] = useState(false)

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
  const vehicle = (fullLead as { ai_vehicle_size?: string } | null)?.ai_vehicle_size ?? null

  const handleSchedule = async () => {
    if (!confirm('Schedule this lead as a job?')) return
    try {
      await convertLeadToClient(lead.id)
      toast.success('Lead scheduled!')
      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error scheduling:', error)
      toast.error('Failed to schedule')
    }
  }

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

  const scrollToSmsComposer = () => {
    const el = document.getElementById('sms-composer')
    el?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    setTimeout(() => {
      const textarea = el?.querySelector('textarea')
      textarea?.focus()
    }, 300)
  }

  const addQuickText = (kind: keyof typeof QUICK_TEXTS) => {
    const firstName = (fullLead?.name ?? lead.name).split(' ')[0] || (fullLead?.name ?? lead.name)
    const text = QUICK_TEXTS[kind](firstName)
    setMessage((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  const displayStatuses: DisplayStatus[] = ['new', 'followup', 'warm', 'hot', 'booked', 'cold']

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200/50 px-5 pt-5 dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold text-zinc-900 dark:text-white">
              {fullLead?.name ?? lead.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 hover:underline">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 hover:underline">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill className={STATUS_PILL_CLASS[displayStatus]}>{STATUS_LABEL[displayStatus]}</Pill>
              {(fullLead?.interested_in_service_name ?? lead.interested_in_service_name) && (
                <Pill className="bg-zinc-50 text-zinc-800 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600">
                  {fullLead?.interested_in_service_name ?? lead.interested_in_service_name}
                </Pill>
              )}
              {(fullLead?.estimated_value ?? lead.estimated_value) != null && (
                <Pill className="bg-zinc-50 text-zinc-800 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600">
                  {formatMoney(fullLead?.estimated_value ?? lead.estimated_value ?? 0)}
                </Pill>
              )}
            </div>
            {(fullLead?.source ?? lead.source) && (
              <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Source: {fullLead?.source ?? lead.source}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-5 h-px w-full bg-zinc-200 dark:bg-white/10" />

      {/* Actions */}
      <div className="space-y-2 px-5 py-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            className="col-span-1"
            asChild={!!lead.phone}
            disabled={!lead.phone}
          >
            {lead.phone ? (
              <a href={`tel:${lead.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            ) : (
              <span><Phone className="mr-2 h-4 w-4" /> Call</span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!lead.phone}
            onClick={scrollToSmsComposer}
            className="col-span-1"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Text
          </Button>
          <Button size="sm" variant="outline" className="col-span-1" onClick={handleSchedule}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-rose-600 ring-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
            onClick={handleMarkNotInterested}
          >
            Not Interested
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-rose-600 ring-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-zinc-200 dark:bg-white/10" />

      {/* Content: Snapshot, Next Action, Timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Lead Snapshot */}
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-white/10">
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">Lead Snapshot</div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div className="text-zinc-500 dark:text-zinc-400">Service</div>
            <div className="font-medium text-zinc-900 dark:text-white">
              {fullLead?.interested_in_service_name ?? lead.interested_in_service_name ?? '—'}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">Est. Revenue</div>
            <div className="font-medium text-zinc-900 dark:text-white">
              {formatMoney(fullLead?.estimated_value ?? lead.estimated_value ?? 0)}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">Est. Time</div>
            <div className="font-medium text-zinc-900 dark:text-white">{estTime}</div>
            <div className="text-zinc-500 dark:text-zinc-400">Vehicle</div>
            <div className="font-medium text-zinc-900 dark:text-white">{vehicle ?? 'Not provided'}</div>
            <div className="text-zinc-500 dark:text-zinc-400">Address</div>
            <div className="font-medium text-zinc-900 dark:text-white">Not provided</div>
          </div>
        </div>

        {/* Next Action */}
        {hint && (
          <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <Sparkles className="h-4 w-4" />
              Next Action
            </div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{hint}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {displayStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleUpdateStatus(s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold ring-1 transition',
                    displayStatus === s
                      ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                      : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/5'
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity / Timeline */}
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-white/10">
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">Activity</div>
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Loading...</div>
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
          className="border-t border-zinc-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">Quick Text Reply</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">SMS</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addQuickText('intro')}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Intro
            </button>
            <button
              type="button"
              onClick={() => addQuickText('availability')}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Availability
            </button>
            <button
              type="button"
              onClick={() => addQuickText('bookNow')}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Book Now
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quick reply to book this job…"
            className="mt-3 h-24 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-violet-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSendSMS()
              }
            }}
          />
          <Button
            size="sm"
            className="mt-3 w-full"
            disabled={!message.trim() || sending}
            onClick={handleSendSMS}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send SMS
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
