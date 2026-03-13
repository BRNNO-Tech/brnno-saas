'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getConversationsForBusiness,
  getMessagesForLead,
  sendMessageAsWorker,
  type ConversationRow,
  type MessageWithSender,
} from '@/lib/actions/messages'

export function WorkerMessagesInbox({
  teamMemberId,
  businessId,
  workerName,
  initialLeadId = null,
}: {
  teamMemberId: string
  businessId: string
  workerName: string
  initialLeadId?: string | null
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
      const list = await getConversationsForBusiness(businessId)
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
  }, [businessId])

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
      const list = await getMessagesForLead(leadId, true)
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
      .channel(`worker_messages:${leadId}`)
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
      await sendMessageAsWorker(teamMemberId, businessId, leadId, text)
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
    if (m.sender_type === 'team_member') {
      if (m.team_member?.name) return m.team_member.name
      if (m.team_member_id === teamMemberId) return workerName
      return 'Team member'
    }
    if (m.sender_type === 'business') return 'Manager'
    return 'Customer'
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-1 min-h-0 gap-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      {/* Left panel: conversation list */}
      <div className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Conversations
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 p-3">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 p-3">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.lead_id}
                type="button"
                onClick={() => setSelectedLeadId(conv.lead_id)}
                className={`w-full text-left p-3 border-b border-zinc-200 dark:border-zinc-800 transition-colors ${
                  leadId === conv.lead_id
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-l-2 border-l-amber-500'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {conv.leadName}
                </p>
                {conv.lastPreview ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {conv.lastPreview}
                  </p>
                ) : null}
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {formatTime(conv.last_message_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: thread or empty state */}
      {leadId === null ? (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8 text-center">
          <p className="text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Select a conversation
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 rounded-r-lg overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" ref={listRef}>
            {loading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                Loading...
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
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
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {senderLabel(m)}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        outbound
                          ? 'bg-amber-500 text-amber-950'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 bg-white dark:bg-zinc-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 min-w-0 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-md px-4 py-2 bg-amber-500 text-amber-950 font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
