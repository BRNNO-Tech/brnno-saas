'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMessagesForLead, sendMessage, type ConversationItem, type MessageRow } from '@/lib/actions/messages'
import { Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MessagesInbox({
  initialConversations,
}: {
  initialConversations: ConversationItem[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadParam = searchParams.get('lead')
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leadParam || null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const syncUrl = useCallback((leadId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (leadId) params.set('lead', leadId)
    else params.delete('lead')
    const q = params.toString()
    router.replace(q ? `?${q}` : '/dashboard/messages', { scroll: false })
  }, [router, searchParams])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  useEffect(() => {
    if (leadParam && leadParam !== selectedLeadId) setSelectedLeadId(leadParam)
  }, [leadParam])

  useEffect(() => {
    if (!selectedLeadId) {
      setMessages([])
      return
    }
    setLoading(true)
    setError(null)
    getMessagesForLead(selectedLeadId)
      .then(setMessages)
      .finally(() => setLoading(false))
  }, [selectedLeadId])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelect = (leadId: string) => {
    setSelectedLeadId(leadId)
    syncUrl(leadId)
  }

  const handleSend = async () => {
    const body = input.trim()
    if (!body || !selectedLeadId || sending) return
    setSending(true)
    setError(null)
    const result = await sendMessage(selectedLeadId, body)
    setSending(false)
    if (result.success) {
      setInput('')
      setMessages((prev) => [...prev, result.message])
      setConversations((prev) => {
        const conv = prev.find((c) => c.leadId === selectedLeadId)
        if (!conv) return prev
        const updated = {
          ...conv,
          lastPreview: body.length > 60 ? body.slice(0, 60) + '…' : body,
          lastAt: result.message.created_at,
        }
        const rest = prev.filter((c) => c.leadId !== selectedLeadId)
        return [updated, ...rest]
      })
    } else {
      setError(result.error ?? 'Failed to send')
    }
  }

  const selectedConv = conversations.find((c) => c.leadId === selectedLeadId)

  return (
    <div className="dashboard-theme flex h-[calc(100vh-8rem)] min-h-[400px] border border-[var(--dash-border)] bg-[var(--dash-graphite)] overflow-hidden rounded-lg">
      {/* Left: conversation list */}
      <div
        className={cn(
          'flex flex-col w-full md:w-80 flex-shrink-0 border-r border-[var(--dash-border)] bg-[var(--dash-surface)]',
          selectedLeadId && 'hidden md:flex'
        )}
      >
        <div className="p-3 border-b border-[var(--dash-border)]">
          <h2 className="font-dash-condensed font-bold text-[var(--dash-text)] text-lg uppercase tracking-wider">
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              No conversations yet. When customers reply to your SMS, they’ll appear here.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.leadId}
                type="button"
                onClick={() => handleSelect(conv.leadId)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-[var(--dash-border)] transition-colors',
                  selectedLeadId === conv.leadId
                    ? 'bg-[var(--dash-amber-glow)] border-l-2 border-l-[var(--dash-amber)]'
                    : 'hover:bg-[var(--dash-graphite)]'
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-dash-condensed font-bold text-[13px] text-[var(--dash-text)] truncate">
                    {conv.leadName}
                  </span>
                  <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] shrink-0">
                    {formatTime(conv.lastAt)}
                  </span>
                </div>
                <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)] truncate">
                  {conv.lastPreview}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--dash-graphite)]">
        {selectedLeadId ? (
          <>
            <div className="flex items-center gap-2 p-3 border-b border-[var(--dash-border)] md:border-l border-[var(--dash-border)]">
              <button
                type="button"
                className="md:hidden p-1 rounded border border-[var(--dash-border)] text-[var(--dash-text-muted)]"
                onClick={() => {
                  setSelectedLeadId(null)
                  syncUrl(null)
                }}
                aria-label="Back to list"
              >
                ←
              </button>
              <span className="font-dash-condensed font-bold text-[var(--dash-text)]">
                {selectedConv?.leadName ?? 'Conversation'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  Loading…
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5',
                        msg.direction === 'outbound'
                          ? 'bg-[var(--dash-amber)] text-[var(--dash-black)]'
                          : 'bg-[var(--dash-surface)] text-[var(--dash-text)] border border-[var(--dash-border)]'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      <p
                        className={cn(
                          'mt-1 font-dash-mono text-[10px]',
                          msg.direction === 'outbound'
                            ? 'text-[var(--dash-black)]/70'
                            : 'text-[var(--dash-text-muted)]'
                        )}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={threadEndRef} />
            </div>
            {error && (
              <div className="px-4 py-2 bg-[var(--dash-red)]/10 border-t border-[var(--dash-border)] font-dash-mono text-[11px] text-[var(--dash-red)]">
                {error}
              </div>
            )}
            <div className="p-3 border-t border-[var(--dash-border)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] font-dash-mono text-[13px] focus:outline-none focus:border-[var(--dash-amber)]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-2.5 rounded-lg bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-12 w-12 mx-auto text-[var(--dash-text-muted)] mb-4" />
              <p className="font-dash-condensed font-bold text-[var(--dash-text-muted)] uppercase tracking-wider">
                Select a conversation
              </p>
              <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
                Choose a thread from the list or wait for new replies.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
