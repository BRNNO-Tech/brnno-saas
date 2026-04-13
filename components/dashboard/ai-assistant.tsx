'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, Send, Sparkles, Trash2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getBusiness } from '@/lib/actions/business'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type UpdateJobStatusPayload = {
  type: 'updateJobStatus'
  jobId: string
  status: string
  label: string
}

function parseAssistantAction(raw: string): {
  displayText: string
  kind: 'confirm' | 'execute' | null
  payload: UpdateJobStatusPayload | null
} {
  const trimmed = raw.trim()
  const confirmIdx = trimmed.lastIndexOf('ACTION_CONFIRM:')
  const executeIdx = trimmed.lastIndexOf('ACTION_EXECUTE:')

  if (confirmIdx === -1 && executeIdx === -1) {
    return { displayText: trimmed, kind: null, payload: null }
  }

  const useConfirm = confirmIdx > executeIdx
  const kind: 'confirm' | 'execute' = useConfirm ? 'confirm' : 'execute'
  const cutIdx = useConfirm ? confirmIdx : executeIdx
  const prefixLen = useConfirm ? 'ACTION_CONFIRM:'.length : 'ACTION_EXECUTE:'.length

  const jsonStr = trimmed.slice(cutIdx + prefixLen).trim()
  let displayText = trimmed.slice(0, cutIdx).trimEnd()

  try {
    const o = JSON.parse(jsonStr) as Record<string, unknown>
    if (
      o &&
      o.type === 'updateJobStatus' &&
      typeof o.jobId === 'string' &&
      typeof o.status === 'string' &&
      typeof o.label === 'string'
    ) {
      return {
        displayText,
        kind,
        payload: {
          type: 'updateJobStatus',
          jobId: o.jobId.trim(),
          status: o.status.trim(),
          label: o.label.trim(),
        },
      }
    }
  } catch {
    return { displayText, kind: null, payload: null }
  }
  return { displayText, kind: null, payload: null }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

const EXPIRY_HOURS = 24
const EXPIRY_MS = EXPIRY_HOURS * 60 * 60 * 1000

function storageKeys(businessId: string) {
  return {
    messages: `ai-assistant-messages-${businessId}`,
    expiry: `ai-assistant-expiry-${businessId}`,
  } as const
}

function isChatMessageArray(x: unknown): x is ChatMessage[] {
  if (!Array.isArray(x)) return false
  return x.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m as ChatMessage).role !== undefined &&
      typeof (m as ChatMessage).content === 'string' &&
      ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant')
  )
}

function AIAssistantInner() {
  const [open, setOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [greetingDone, setGreetingDone] = useState(false)
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<UpdateJobStatusPayload | null>(null)
  const [pendingAfterIndex, setPendingAfterIndex] = useState<number | null>(null)
  const [executeLoading, setExecuteLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const b = await getBusiness()
        if (cancelled || !mountedRef.current) return
        if (b?.id) setBusinessId(b.id)
        else setBusinessId(null)
      } catch {
        if (!cancelled && mountedRef.current) setBusinessId(null)
      } finally {
        if (!cancelled && mountedRef.current) setBusinessLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Load persisted messages once per business (or clear expired / invalid). */
  useEffect(() => {
    if (!businessId || businessLoading) {
      if (!businessId) setStorageLoaded(false)
      return
    }

    const { messages: msgKey, expiry: expKey } = storageKeys(businessId)

    try {
      const expRaw = localStorage.getItem(expKey)
      const raw = localStorage.getItem(msgKey)
      const expiresAt = expRaw ? Number(expRaw) : 0

      if (raw && expRaw && expiresAt > Date.now()) {
        const parsed: unknown = JSON.parse(raw)
        if (isChatMessageArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          setGreetingDone(true)
        } else {
          localStorage.removeItem(msgKey)
          localStorage.removeItem(expKey)
          setMessages([])
          setGreetingDone(false)
        }
      } else {
        if (raw || expRaw) {
          localStorage.removeItem(msgKey)
          localStorage.removeItem(expKey)
        }
        setMessages([])
        setGreetingDone(false)
      }
    } catch {
      try {
        localStorage.removeItem(msgKey)
        localStorage.removeItem(expKey)
      } catch {
        /* ignore */
      }
      setMessages([])
      setGreetingDone(false)
    }

    setStorageLoaded(true)
  }, [businessId, businessLoading])

  /** Persist messages + rolling expiry after hydration (avoids clobbering before load). */
  useEffect(() => {
    if (!businessId || !storageLoaded) return
    const { messages: msgKey, expiry: expKey } = storageKeys(businessId)
    try {
      localStorage.setItem(msgKey, JSON.stringify(messages))
      localStorage.setItem(expKey, String(Date.now() + EXPIRY_MS))
    } catch {
      /* quota / private mode */
    }
  }, [messages, businessId, storageLoaded])

  const clearChat = useCallback(() => {
    if (!businessId) return
    const { messages: msgKey, expiry: expKey } = storageKeys(businessId)
    try {
      localStorage.removeItem(msgKey)
      localStorage.removeItem(expKey)
    } catch {
      /* ignore */
    }
    setMessages([])
    setGreetingDone(false)
    setLoading(false)
    setPendingConfirm(null)
    setPendingAfterIndex(null)
    setExecuteLoading(false)
  }, [businessId])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    if (!open || !businessId || businessLoading || !storageLoaded) return
    if (greetingDone) return

    let cancelled = false
    ;(async () => {
      if (!mountedRef.current) return
      setLoading(true)
      try {
        const res = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            businessId,
            bootstrap: true,
            messages: [],
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled && mountedRef.current) {
            setMessages([
              {
                role: 'assistant',
                content:
                  typeof data.error === 'string'
                    ? data.error
                    : 'Could not load the assistant. Please try again.',
              },
            ])
          }
          return
        }
        if (!cancelled && mountedRef.current && typeof data.response === 'string') {
          setMessages([{ role: 'assistant', content: data.response }])
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setMessages([
            {
              role: 'assistant',
              content: 'Something went wrong. Please try again.',
            },
          ])
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
          setGreetingDone(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, businessId, businessLoading, greetingDone, storageLoaded])

  const runJobStatusExecute = useCallback(
    async (payload: UpdateJobStatusPayload) => {
      if (!businessId) return
      const res = await fetch('/api/ai-assistant/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: payload.type,
          jobId: payload.jobId,
          status: payload.status,
          label: payload.label,
          businessId,
        }),
      })
      const execData = await res.json().catch(() => ({}))
      const statusLabel = formatStatusLabel(payload.status)
      if (execData.success === true) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Done — job updated to ${statusLabel} ✅` },
        ])
      } else {
        const errMsg =
          typeof execData.message === 'string'
            ? execData.message
            : 'Could not update the job. Please try from Jobs.'
        setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }])
      }
    },
    [businessId]
  )

  async function sendUserMessage() {
    const text = input.trim()
    if (!text || !businessId || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setInput('')
    setMessages(next)
    setLoading(true)
    setPendingConfirm(null)
    setPendingAfterIndex(null)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessId,
          bootstrap: false,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (mountedRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                typeof data.error === 'string'
                  ? data.error
                  : 'The assistant could not reply. Please try again.',
            },
          ])
        }
        return
      }
      if (mountedRef.current && typeof data.response === 'string') {
        const parsed = parseAssistantAction(data.response)
        const assistantIdx = next.length
        const display =
          parsed.displayText.trim().length > 0
            ? parsed.displayText
            : 'Please confirm below.'

        if (parsed.kind === 'execute' && parsed.payload) {
          setMessages((prev) => [...prev, { role: 'assistant', content: display }])
          setLoading(false)
          setExecuteLoading(true)
          try {
            await runJobStatusExecute(parsed.payload)
          } finally {
            if (mountedRef.current) setExecuteLoading(false)
          }
          return
        }

        if (parsed.kind === 'confirm' && parsed.payload) {
          setMessages((prev) => [...prev, { role: 'assistant', content: display }])
          setPendingConfirm(parsed.payload)
          setPendingAfterIndex(assistantIdx)
          return
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch {
      if (mountedRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Network error. Please try again.',
          },
        ])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const disabledTrigger = businessLoading || !businessId

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabledTrigger}
          className="fixed bottom-20 right-4 z-[60] md:bottom-6 md:right-6 flex items-center gap-2 rounded border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2.5 text-[var(--dash-text)] shadow-lg transition hover:bg-[var(--dash-surface)] hover:border-[var(--dash-amber)]/50 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Open AI Assistant"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded bg-[var(--dash-amber)]/15 text-[var(--dash-amber)]">
            <Bot className="h-4 w-4" />
            <Sparkles className="absolute -right-0.5 -top-0.5 h-3 w-3 text-[var(--dash-amber)]" />
          </span>
          <span className="hidden md:inline font-dash-condensed font-bold text-[13px] uppercase tracking-wider text-[var(--dash-text)]">
            AI Assistant
          </span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm md:bg-black/40"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          />

          <div
            className={[
              'fixed z-[70] flex flex-col border border-[var(--dash-border)] bg-[var(--dash-black)] shadow-2xl',
              'inset-0 max-h-[100dvh] animate-in slide-in-from-bottom duration-300 md:inset-auto md:left-auto md:top-auto',
              'md:bottom-6 md:right-6 md:h-[60vh] md:w-1/2 md:max-w-2xl md:rounded-lg md:slide-in-from-right md:slide-in-from-bottom-0',
            ].join(' ')}
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--dash-border)] px-4 py-3 bg-[var(--dash-graphite)]">
              <h2 className="font-dash-condensed text-lg font-extrabold uppercase tracking-wide text-[var(--dash-amber)]">
                AI Assistant
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => clearChat()}
                  disabled={!businessId}
                  className="flex h-9 items-center gap-1.5 rounded px-2 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] disabled:opacity-40"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[var(--dash-black)]">
              {messages.map((m, i) => (
                <React.Fragment key={i}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'flex justify-end'
                        : 'flex justify-start'
                    }
                  >
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[90%] rounded-lg px-3 py-2 text-sm bg-[var(--dash-amber)] text-[var(--dash-black)] font-medium'
                          : 'max-w-[90%] rounded-lg px-3 py-2 text-sm bg-[var(--dash-graphite)] text-[var(--dash-text)] border border-[var(--dash-border)] prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:text-[var(--dash-text)]'
                      }
                    >
                      {m.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                  {pendingConfirm &&
                    pendingAfterIndex === i &&
                    m.role === 'assistant' && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-3 space-y-3">
                          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider">
                            Confirm update
                          </p>
                          <p className="text-sm text-[var(--dash-text)]">
                            Update job: {pendingConfirm.label} →{' '}
                            <span className="font-medium text-[var(--dash-amber)]">
                              {formatStatusLabel(pendingConfirm.status)}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!businessId || executeLoading}
                              onClick={async () => {
                                if (!pendingConfirm || !businessId) return
                                const payload = pendingConfirm
                                setPendingConfirm(null)
                                setPendingAfterIndex(null)
                                setExecuteLoading(true)
                                try {
                                  await runJobStatusExecute(payload)
                                } finally {
                                  if (mountedRef.current) setExecuteLoading(false)
                                }
                              }}
                              className="rounded px-3 py-1.5 font-dash-mono text-[10px] uppercase tracking-wider bg-[var(--dash-amber)] text-[var(--dash-black)] hover:opacity-90 disabled:opacity-40"
                            >
                              Confirm ✓
                            </button>
                            <button
                              type="button"
                              disabled={executeLoading}
                              onClick={() => {
                                setPendingConfirm(null)
                                setPendingAfterIndex(null)
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    role: 'assistant',
                                    content: 'No problem, job status unchanged.',
                                  },
                                ])
                              }}
                              className="rounded px-3 py-1.5 font-dash-mono text-[10px] uppercase tracking-wider border border-[var(--dash-border)] bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
                            >
                              Cancel ✗
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </React.Fragment>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2 text-sm font-dash-mono text-[var(--dash-text-dim)]">
                    Thinking…
                  </div>
                </div>
              )}
              {executeLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2 text-sm font-dash-mono text-[var(--dash-text-dim)]">
                    Updating job…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="shrink-0 border-t border-[var(--dash-border)] p-3 bg-[var(--dash-graphite)] flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void sendUserMessage()
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about jobs, revenue, leads…"
                disabled={!businessId || loading}
                className="font-dash-mono flex-1 rounded border border-[var(--dash-border)] bg-[var(--dash-black)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-amber)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || !businessId || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--dash-amber)] text-[var(--dash-black)] hover:opacity-90 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}

const HIDDEN_ASSISTANT_PATH =
  /^\/dashboard\/(?:(?:leads|jobs|services|upgrades)(?:\/.*)?$|settings\/subscription(?:\/.*)?$)/

export default function AIAssistant() {
  const pathname = usePathname()
  if (HIDDEN_ASSISTANT_PATH.test(pathname)) return null
  return <AIAssistantInner />
}
