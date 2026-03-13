'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessageAsCustomer } from '@/lib/actions/messages'
import type { MessageRow } from '@/lib/actions/messages'

export function ChatWidget({
  clientId,
  leadId,
  businessName,
}: {
  clientId: string
  leadId: string
  businessName: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  async function loadMessages() {
    setLoading(true)
    try {
      const { getMessagesForLead } = await import('@/lib/actions/messages')
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
    if (!open || !leadId) return
    loadMessages()
  }, [open, leadId])

  useEffect(() => {
    if (!open || !leadId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          import('@/lib/actions/messages')
            .then(({ getMessagesForLead }) => getMessagesForLead(leadId, true))
            .then((list) => setMessages(list))
            .catch(() => {})
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, leadId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMessageAsCustomer(clientId, leadId, text)
      await loadMessages()
    } catch (e) {
      console.error('Send failed:', e)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const isCustomer = (m: MessageRow) => m.sender_type === 'customer' || m.direction === 'inbound'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-zinc-900 shadow-lg hover:bg-amber-400 transition-colors"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-3rem,380px)] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Chat with {businessName}</p>
          </div>
          <div
            ref={listRef}
            className="flex-1 min-h-[240px] max-h-[320px] overflow-y-auto p-3 space-y-2"
          >
            {loading ? (
              <p className="text-sm text-zinc-500 text-center py-6">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No messages yet. Say hi!</p>
            ) : (
              messages.map((m) => {
                const fromCustomer = isCustomer(m)
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${fromCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-zinc-500 mb-0.5">
                      {fromCustomer ? 'You' : businessName}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        fromCustomer
                          ? 'bg-amber-500 text-zinc-900'
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
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 min-w-0 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-lg bg-amber-500 text-zinc-900 p-2 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
