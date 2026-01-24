'use client'

import { MessageSquare, Mail, Phone, FileText, CheckCircle, Clock, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: 'created' | 'sms' | 'email' | 'call' | 'note' | 'status_change' | 'booked' | string
  direction?: 'inbound' | 'outbound'
  content?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  user?: string
}

interface LeadTimelineProps {
  leadId: string
  leadCreatedAt: string
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
  status?: string
  lastContactedAt?: string | null
}

export function LeadTimeline({ leadId, leadCreatedAt, interactions = [], status, lastContactedAt }: LeadTimelineProps) {
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Unknown'
    }
  }

  const getEventIcon = (type: string, direction?: string) => {
    switch (type) {
      case 'created':
        return <UserPlus className="h-4 w-4" />
      case 'sms':
      case 'text':
        return <MessageSquare className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'booked':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string, direction?: string) => {
    if (direction === 'inbound') {
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
    }
    switch (type) {
      case 'created':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
      case 'booked':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      case 'sms':
      case 'text':
        return 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30'
      case 'email':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
      case 'call':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
      default:
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30'
    }
  }

  const events: TimelineEvent[] = [
    {
      id: 'created',
      type: 'created',
      timestamp: leadCreatedAt,
    },
    ...interactions.map(interaction => ({
      id: interaction.id,
      type: interaction.type as TimelineEvent['type'],
      direction: interaction.direction as 'inbound' | 'outbound' | undefined,
      content: interaction.content,
      timestamp: interaction.created_at,
    })),
    ...(status === 'booked' ? [{
      id: 'booked',
      type: 'booked' as const,
      timestamp: lastContactedAt || new Date().toISOString(),
    } as TimelineEvent] : []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (events.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-12">
        <div className="h-10 w-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <Clock className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="font-medium">No timeline events yet</p>
        <p className="text-xs mt-1">Interactions and messages will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={cn(
              'flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-200',
              'hover:scale-110 hover:shadow-md',
              getEventColor(event.type, event.direction)
            )}>
              {getEventIcon(event.type, event.direction)}
            </div>
            {index < events.length - 1 && (
              <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-4 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-900 dark:text-white capitalize">
                  {event.type === 'created' && 'Lead created'}
                  {event.type === 'sms' && (event.direction === 'inbound' ? 'Received SMS' : 'Sent SMS')}
                  {event.type === 'email' && (event.direction === 'inbound' ? 'Received Email' : 'Sent Email')}
                  {event.type === 'call' && (event.direction === 'inbound' ? 'Received Call' : 'Made Call')}
                  {event.type === 'note' && 'Note added'}
                  {event.type === 'booked' && 'Lead booked'}
                  {event.type === 'status_change' && 'Status changed'}
                </span>
                {event.direction === 'inbound' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-700 dark:text-violet-300">
                    Inbound
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>

            {event.content && (
              <div className="mt-2 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                <p className="text-sm text-zinc-900 dark:text-white whitespace-pre-wrap break-words">
                  {event.content}
                </p>
              </div>
            )}

            {event.status && (
              <div className="mt-2 flex items-center gap-2">
                <span className={cn(
                  'text-xs',
                  event.status === 'failed' && 'text-red-600 dark:text-red-400',
                  event.status === 'read' && 'text-emerald-600 dark:text-emerald-400',
                  event.status === 'delivered' && 'text-blue-600 dark:text-blue-400',
                  event.status === 'sent' && 'text-zinc-600 dark:text-zinc-400'
                )}>
                  {event.status === 'sent' && '✓ Sent'}
                  {event.status === 'delivered' && '✓✓ Delivered'}
                  {event.status === 'read' && '✓✓✓ Read'}
                  {event.status === 'failed' && '✗ Failed'}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
