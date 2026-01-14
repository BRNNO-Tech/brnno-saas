'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Phone, Mail, MessageSquare, Clock, FileText, Calendar, Sparkles, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateLeadStatus, addLeadInteraction } from '@/lib/actions/leads'
import { LeadTimeline } from './lead-timeline'
import { getLead } from '@/lib/actions/leads'
import { toast } from 'sonner'

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

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'quote' | 'booking'>('timeline')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'human' | 'premium' | 'direct'>('human')
  const [sending, setSending] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [fullLead, setFullLead] = useState<Lead | null>(lead)
  const [loading, setLoading] = useState(false)
  const [interactionType, setInteractionType] = useState<'sms' | 'email' | 'call' | 'note'>('sms')

  // Fetch full lead data with interactions when panel opens
  useEffect(() => {
    async function loadFullLead() {
      setLoading(true)
      try {
        // Use server action to get full lead data
        const { getLead } = await import('@/lib/actions/leads')
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

  const formatLastTouch = (dateString: string | null) => {
    if (!dateString) return 'Never'
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
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">{fullLead?.name || lead.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(getScoreColor(fullLead?.score || lead.score), 'transition-all hover:scale-105')}>
            {fullLead?.score || lead.score}
          </Badge>
          <select
            value={fullLead?.status || lead.status}
            onChange={async (e) => {
              try {
                await updateLeadStatus(lead.id, e.target.value as any)
                // Reload lead data
                const { getLead } = await import('@/lib/actions/leads')
                const updatedLead = await getLead(lead.id)
                setFullLead(updatedLead as any)
              } catch (error) {
                console.error('Error updating status:', error)
                toast.error('Failed to update status')
              }
            }}
            className="text-xs rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-2 py-1 text-zinc-900 dark:text-white transition-all hover:border-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="new">New</option>
            <option value="in_progress">Engaged</option>
            <option value="booked">Booked</option>
            <option value="lost">Lost</option>
            <option value="dnc">DNC</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 border-b border-zinc-200/50 dark:border-white/10">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="quote" className="text-xs">Quote</TabsTrigger>
            <TabsTrigger value="booking" className="text-xs">Booking</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="timeline" className="mt-0 p-4 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-16 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <LeadTimeline
                leadId={lead.id}
                leadCreatedAt={fullLead?.created_at || lead.created_at}
                interactions={fullLead?.interactions || lead.interactions || []}
                status={fullLead?.status || lead.status}
                lastContactedAt={fullLead?.last_contacted_at || lead.last_contacted_at}
              />
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-0 p-4">
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
              Notes coming soon
            </div>
          </TabsContent>

          <TabsContent value="quote" className="mt-0 p-4">
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
              Quote/Estimate coming soon
            </div>
          </TabsContent>

          <TabsContent value="booking" className="mt-0 p-4">
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
              Booking coming soon
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* AI Composer - Sticky at Bottom */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
        <div className="space-y-3">
          {/* Interaction Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 dark:text-white/55">Type:</span>
            <div className="flex gap-1">
              {(['sms', 'email', 'call', 'note'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setInteractionType(type)}
                  className={cn(
                    'px-2 py-1 rounded text-xs transition-all duration-150 capitalize',
                    interactionType === type
                      ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm'
                      : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent'
                  )}
                >
                  {type === 'sms' && <MessageSquare className="h-3 w-3 inline mr-1" />}
                  {type === 'email' && <Mail className="h-3 w-3 inline mr-1" />}
                  {type === 'call' && <Phone className="h-3 w-3 inline mr-1" />}
                  {type === 'note' && <FileText className="h-3 w-3 inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              interactionType === 'sms' ? 'Type your SMS message...' :
              interactionType === 'email' ? 'Type your email...' :
              interactionType === 'call' ? 'Add call notes...' :
              'Add a note...'
            }
            className="w-full min-h-[80px] rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                if (message.trim() && !sending) {
                  // Trigger send
                  const sendButton = e.currentTarget.parentElement?.querySelector('button:has(svg[class*="Send"])')
                  if (sendButton) {
                    (sendButton as HTMLButtonElement).click()
                  }
                }
              }
            }}
          />
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs transition-all hover:bg-violet-500/10 hover:border-violet-500/30"
              onClick={async () => {
                setShowAiSuggestions(true)
                // TODO: Call AI API to generate suggestions
                setAiSuggestions([
                  "Hi {name}! Still interested in {service}? I can lock in your spot today!",
                  "Hey {name}, quick question - what's the best time to reach you about {service}?",
                  "{name}, I noticed you were looking at {service}. Want to schedule? I have availability this week!"
                ])
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Suggest
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs transition-all hover:bg-amber-500/10 hover:border-amber-500/30"
              onClick={() => {
                const incentiveMessage = `Hi ${lead.name}! I can offer you 10% off ${lead.interested_in_service_name || 'your service'} if you book this week. Interested?`
                setMessage(incentiveMessage)
              }}
            >
              Offer Incentive
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs transition-all hover:bg-cyan-500/10 hover:border-cyan-500/30"
              onClick={() => {
                const questionsMessage = `Hi ${lead.name}! Quick questions: 1) What's your preferred date? 2) Any specific concerns about ${lead.interested_in_service_name || 'the service'}?`
                setMessage(questionsMessage)
              }}
            >
              Ask 2 Questions
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30"
              onClick={() => {
                const bookingMessage = `Hi ${lead.name}! Ready to book ${lead.interested_in_service_name || 'your service'}? Here's your link: [booking link]`
                setMessage(bookingMessage)
              }}
            >
              Send Booking Link
            </Button>
          </div>

          {/* AI Suggestions Panel */}
          {showAiSuggestions && aiSuggestions.length > 0 && (
            <div className="rounded-lg border border-violet-500/20 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-violet-900 dark:text-violet-100 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Suggestions
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-violet-500/20"
                  onClick={() => setShowAiSuggestions(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(suggestion.replace('{name}', lead.name).replace('{service}', lead.interested_in_service_name || 'the service'))
                    setShowAiSuggestions(false)
                  }}
                  className="w-full text-left p-2 rounded border border-violet-500/20 dark:border-violet-500/30 bg-white/50 dark:bg-zinc-900/50 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 hover:border-violet-500/40 transition-all duration-150 text-xs"
                >
                  {suggestion.replace('{name}', lead.name).replace('{service}', lead.interested_in_service_name || 'the service')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 dark:text-white/55">Tone:</span>
              <div className="flex gap-1">
                {(['human', 'premium', 'direct'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      'px-2 py-1 rounded text-xs transition-all duration-150',
                      tone === t
                        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm'
                        : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent'
                    )}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              disabled={!message.trim() || sending}
              onClick={async () => {
                if (!message.trim()) return
                setSending(true)
                try {
                  await addLeadInteraction(lead.id, interactionType, message)
                  setMessage('')
                  setShowAiSuggestions(false)
                  // Show success toast
                  const typeLabel = interactionType === 'sms' ? 'SMS' : interactionType === 'email' ? 'Email' : interactionType === 'call' ? 'Call' : 'Note'
                  toast.success(`${typeLabel} sent!`, {
                    description: 'The interaction has been added to the timeline',
                  })
                  // Reload full lead data to update timeline
                  const { getLead } = await import('@/lib/actions/leads')
                  const updatedLead = await getLead(lead.id)
                  setFullLead(updatedLead as any)
                } catch (error) {
                  console.error('Error sending message:', error)
                  toast.error(`Failed to send ${interactionType}`)
                } finally {
                  setSending(false)
                }
              }}
              className="transition-all hover:scale-105 active:scale-95"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
              Always short. Always book-forward.
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {interactionType === 'sms' && '⌘+Enter to send'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
