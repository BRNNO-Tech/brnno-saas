'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessagesForLead, sendMessage, type MessageWithSender } from '@/lib/actions/messages'

export function MessagesInbox({
  leadId,
  businessName = 'You',
}: {
  leadId: string | null
  businessName?: string
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

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

  if (leadId === null) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
        <p className="font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">
          Select a conversation
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)]">
      <div className="flex-1 min-h-[300px] max-h-[60vh] overflow-y-auto p-4 space-y-3" ref={listRef}>
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
      <div className="p-3 border-t border-[var(--dash-border)] flex gap-2">
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
  )
}
