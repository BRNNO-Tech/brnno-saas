'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, CheckCircle, Clock, Copy, Check } from 'lucide-react'

type Quote = {
  id: string
  quote_code?: string
  total_price?: number
  total?: number
  vehicle_type?: string
  vehicle_condition?: string
  customer_name?: string | null
  customer_phone?: string | null
  customer_email?: string | null
  created_at: string
  viewed_at?: string | null
  booked?: boolean
}

const VEHICLE_LABELS: Record<string, string> = {
  sedan: '🚗 Sedan',
  suv: '🚙 SUV',
  truck: '🚚 Truck',
  van: '🚐 Van',
  coupe: '🏎️ Coupe',
  crossover: '🚙 Crossover',
}

function StatusBadge({ quote }: { quote: Quote }) {
  if (quote.booked) return (
    <span className="flex items-center gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-green)] border border-[var(--dash-green)]/30 px-1.5 py-0.5">
      <CheckCircle className="h-2.5 w-2.5" /> Booked
    </span>
  )
  if (quote.viewed_at) return (
    <span className="flex items-center gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-blue)] border border-[var(--dash-blue)]/30 px-1.5 py-0.5">
      <Eye className="h-2.5 w-2.5" /> Viewed
    </span>
  )
  return (
    <span className="flex items-center gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-text-muted)] border border-[var(--dash-border-bright)] px-1.5 py-0.5">
      <Clock className="h-2.5 w-2.5" /> Pending
    </span>
  )
}

export default function RecentQuotes({ quotes }: { quotes: Quote[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  function copyQuoteLink(e: React.MouseEvent, code: string) {
    e.preventDefault()
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/q/${code}`)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  if (quotes.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No Quotes Yet</div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Generate your first quote using the form</div>
      </div>
    )
  }

  return (
    <div className="space-y-px bg-[var(--dash-border)]">
      {quotes.map(quote => {
        const price = quote.total_price ?? quote.total ?? 0
        const code = quote.quote_code || quote.id.substring(0, 8).toUpperCase()
        const vehicleLabel = VEHICLE_LABELS[quote.vehicle_type || 'sedan'] || quote.vehicle_type || 'Vehicle'
        const isCopied = copiedCode === code

        return (
          <div key={quote.id} className="bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors">
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Status bar */}
              <div className={`w-0.5 h-10 rounded-sm flex-shrink-0 ${quote.booked ? 'bg-[var(--dash-green)]' : quote.viewed_at ? 'bg-[var(--dash-blue)]' : 'bg-[var(--dash-border-bright)]'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-dash-mono text-[11px] text-[var(--dash-text)] font-medium">{code}</span>
                  <StatusBadge quote={quote} />
                </div>
                <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-text)] truncate">
                  {quote.customer_name || 'No name'} · {vehicleLabel}
                </div>
                <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
                  {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Price + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-dash-condensed font-extrabold text-xl text-[var(--dash-amber)]">
                  ${price.toFixed(2)}
                </span>
                <button
                  onClick={e => copyQuoteLink(e, code)}
                  className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)] hover:bg-[var(--dash-amber-glow)] rounded transition-colors"
                  title="Copy link"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-[var(--dash-green)]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <Link
                  href={`/q/${code}`}
                  target="_blank"
                  className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
                  title="View quote"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
