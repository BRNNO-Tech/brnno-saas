'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Phone, Mail, MessageSquare, Calendar, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateLeadStatus, addLeadInteraction, convertLeadToClient, deleteLead } from '@/lib/actions/leads'
import { getLead } from '@/lib/actions/leads'
import { LeadTimeline } from './lead-timeline'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

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
        setFullLead(fullLeadData as any)
      } catch (error) {
        console.error('Error loading lead:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFullLead()
  }, [lead.id])

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'hot':
        return 'bg-red-500/15 text-red-700 dark:text-red-300'
      case 'warm':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
      case 'cold':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
      default:
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300'
    }
  }

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
      setFullLead(updatedLead as any)
      toast.success('Marked as not interested')
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${lead.name}"? This action cannot be undone.`)) {
      return
    }

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
      setFullLead(updatedLead as any)
    } catch (error) {
      console.error('Error sending SMS:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS'
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-white/10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">{fullLead?.name || lead.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  No phone
                </span>
              )}
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  No email
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(getScoreColor(fullLead?.score || lead.score))}>
            {fullLead?.score || lead.score}
          </Badge>
          {lead.interested_in_service_name && (
            <Badge variant="outline" className="text-xs">
              {lead.interested_in_service_name}
            </Badge>
          )}
          {lead.estimated_value && (
            <Badge variant="outline" className="text-xs">
              ${lead.estimated_value}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-white/10 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild={!!lead.phone}
            disabled={!lead.phone}
            className={!lead.phone ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {lead.phone ? (
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </a>
            ) : (
              <span>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!lead.phone}
            className={!lead.phone ? 'opacity-50 cursor-not-allowed' : ''}
            onClick={() => {
              if (lead.phone) {
                const textarea = document.querySelector('textarea')
                if (textarea) textarea.focus()
              }
            }}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Text
          </Button>

          <Button variant="outline" size="sm" onClick={handleSchedule}>
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleMarkNotInterested}
          >
            Not Interested
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-sm text-zinc-500 py-8">Loading...</div>
        ) : (
          <LeadTimeline
            leadId={lead.id}
            leadCreatedAt={fullLead?.created_at || lead.created_at}
            interactions={fullLead?.interactions || lead.interactions || []}
            status={fullLead?.status || lead.status}
            lastContactedAt={fullLead?.last_contacted_at || lead.last_contacted_at}
          />
        )}
      </div>

      {/* SMS Composer */}
      {lead.phone && (
        <div className="p-4 border-t border-zinc-200/50 dark:border-white/10 space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your SMS message..."
            className="w-full min-h-[60px] rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSendSMS()
              }
            }}
          />
          <Button
            size="sm"
            className="w-full"
            disabled={!message.trim() || sending}
            onClick={handleSendSMS}
          >
            {sending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Send SMS
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
