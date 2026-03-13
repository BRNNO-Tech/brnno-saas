'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getConversations,
  getMessagesForLead,
  sendMessage,
  type ConversationRow,
  type MessageWithSender,
} from '@/lib/actions/messages'

export function MessagesInbox({
  leadId: initialLeadId = null,
  businessName = 'You',
}: {
  leadId?: string | null
  businessName?: string
}) {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId ?? null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const leadId = selectedLeadId ?? initialLeadId ?? null

  async function loadConversations() {
    setConversationsLoading(true)
    try {
      const list = await getConversations()
      setConversations(list)
    } catch (e) {
      console.error('Failed to load conversations:', e)
      setConversations([])
    } finally {
      setConversationsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (initialLeadId != null) setSelectedLeadId(initialLeadId)
  }, [initialLeadId])

  async function loadMessages() {
    if (!leadId) {
      setMessages([])
      return
    }
    setLoading(true)
    try {
      const list = await getMessagesForLead(leadId)
      setMessages(list)
    } catch (e) {
      console.error('Failed to load messages:', e)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [leadId])

  useEffect(() => {
    if (!leadId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`messages_inbox:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const row = payload.new as MessageWithSender
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!leadId || !text || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMessage(leadId, text)
      await loadMessages()
    } catch (e) {
      console.error('Send failed:', e)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const isOutbound = (m: MessageWithSender) =>
    m.sender_type === 'business' || m.sender_type === 'team_member' || m.direction === 'outbound'

  const senderLabel = (m: MessageWithSender) => {
    if (m.sender_type === 'team_member' && m.team_member?.name) return m.team_member.name
    if (m.sender_type === 'business') return businessName
    return 'Customer'
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-1 min-h-0 gap-0 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] overflow-hidden">
      {/* Left panel: conversation list */}
      <div className="w-64 shrink-0 border-r border-[var(--dash-border)] flex flex-col bg-[var(--dash-surface)]">
        <div className="p-2 border-b border-[var(--dash-border)]">
          <p className="font-dash-condensed font-bold text-[11px] uppercase text-[var(--dash-text-muted)]">
            Conversations
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] p-3">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] p-3">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.lead_id}
                type="button"
                onClick={() => setSelectedLeadId(conv.lead_id)}
                className={`w-full text-left p-3 border-b border-[var(--dash-border)] transition-colors ${
                  leadId === conv.lead_id
                    ? 'bg-[var(--dash-amber-glow)] border-l-2 border-l-[var(--dash-amber)]'
                    : 'hover:bg-[var(--dash-graphite)]'
                }`}
              >
                <p className="font-dash-condensed font-bold text-[12px] text-[var(--dash-text)] truncate">
                  {conv.leadName}
                </p>
                {conv.lastPreview ? (
                  <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] truncate mt-0.5">
                    {conv.lastPreview}
                  </p>
                ) : null}
                <p className="font-dash-mono text-[10px] text-[var(--dash-text-dim)] mt-0.5">
                  {formatTime(conv.last_message_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: thread or empty state */}
      {leadId === null ? (
        <div className="flex flex-1 items-center justify-center bg-[var(--dash-graphite)] p-8 text-center">
          <p className="font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">
            Select a conversation
          </p>
        </div>
      ) : (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 rounded-r-lg overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" ref={listRef}>
        {loading ? (
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] text-center py-8">
            Loading...
          </p>
        ) : messages.length === 0 ? (
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] text-center py-8">
            No messages yet
          </p>
        ) : (
          messages.map((m) => {
            const outbound = isOutbound(m)
            return (
              <div
                key={m.id}
                className={`flex flex-col ${outbound ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-dash-mono text-[var(--dash-text-muted)] mb-1">
                  {senderLabel(m)}
                </span>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-dash-mono ${
                    outbound
                      ? 'bg-[var(--dash-amber)] text-[var(--dash-black)]'
                      : 'bg-[var(--dash-surface)] text-[var(--dash-text)] border border-[var(--dash-border)]'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="shrink-0 p-3 border-t border-[var(--dash-border)] flex gap-2 bg-[var(--dash-graphite)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 min-w-0 rounded border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-amber)]"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded px-4 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Send
        </button>
      </div>
    </div>
      )}
    </div>
  )
}
