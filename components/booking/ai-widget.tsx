'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

function headerInitial(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  return t[0].toUpperCase()
}

export type AIWidgetBusiness = {
  id: string
  name: string
  subdomain: string
  logo_url: string | null
  billing_plan: string | null
  subscription_status: string | null
  business_hours: unknown
  accent_color: string | null
}

/** Matches DB `services` rows (price column; base_duration / estimated_duration for minutes). */
export type AIWidgetService = {
  id: string
  name: string
  description?: string | null
  price?: number | null
  base_price?: number | null
  pricing_model?: string | null
  variations?: unknown
  duration_minutes?: number | null
  base_duration?: number | null
  estimated_duration?: number | null
  whats_included?: unknown
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function AIWidget({
  business,
  services,
}: {
  business: AIWidgetBusiness
  services: AIWidgetService[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const logoUrl = business.logo_url?.trim() ?? ''
  const showLogo = logoUrl.length > 0 && !logoFailed

  useEffect(() => {
    setLogoFailed(false)
  }, [logoUrl])

  const hideWidget =
    pathname.includes('/book/checkout') || pathname.includes('/book/confirmation')

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  if (hideWidget) {
    return null
  }

  const bubbleColor = business.accent_color?.trim() || '#18181b'

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          messages: nextMessages,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const reply = typeof data.text === 'string' ? data.text : ''
      if (!reply) {
        throw new Error('Empty response from assistant')
      }

      setMessages([...nextMessages, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      setMessages(nextMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:opacity-90 md:bottom-6 md:right-6"
          style={{ backgroundColor: bubbleColor, color: '#fff' }}
        >
          <MessageCircle className="h-7 w-7" strokeWidth={2} />
        </button>
      )}

      {/* Panel: mobile full screen, desktop fixed card */}
      {open && (
        <div
          className="fixed inset-0 z-[101] flex flex-col bg-white dark:bg-zinc-950 md:inset-auto md:bottom-24 md:right-6 md:h-[500px] md:w-[380px] md:rounded-xl md:border md:border-zinc-200 md:shadow-2xl dark:md:border-zinc-800"
          role="dialog"
          aria-label="Chat with assistant"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            {showLogo ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700">
                <Image
                  src={logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  onError={() => setLogoFailed(true)}
                />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: bubbleColor }}
                aria-hidden
              >
                {headerInitial(business.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                Ask me anything
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{business.name}</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !error && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ask about our services, pricing, or hours.
              </p>
            )}
            <ul className="space-y-3">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-700'
                        : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ol]:my-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {loading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <div ref={listEndRef} />
          </div>

          <footer className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Type a message…"
                disabled={loading}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                aria-label="Send"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}
