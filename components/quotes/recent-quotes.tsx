'use client'

import { ExternalLink, Eye, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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

export default function RecentQuotes({ quotes }: { quotes: Quote[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  function copyQuoteLink(code: string) {
    // Only access window in browser environment
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/q/${code}`
      navigator.clipboard.writeText(link)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }
  
  function formatVehicleType(type: string) {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }
  
  function formatCondition(condition: string) {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  
  if (quotes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-zinc-600 dark:text-white/50">
          No quotes yet. Generate your first quote above!
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        // Handle both total_price and total fields, and ensure quote_code exists
        const price = quote.total_price ?? quote.total ?? 0
        const quoteCode = quote.quote_code || quote.id.substring(0, 8).toUpperCase()
        // Use relative path to avoid window.location.origin during SSR
        const quoteLink = `/q/${quoteCode}`
        const isCopied = copiedCode === quoteCode
        const vehicleLabels = {
          sedan: '🚗 Sedan',
          suv: '🚙 SUV',
          truck: '🚚 Truck'
        }
        const vehicleType = quote.vehicle_type || 'sedan'
        const vehicleLabel = vehicleLabels[vehicleType as keyof typeof vehicleLabels] || vehicleType
        
        return (
          <Link
            key={quote.id}
            href={quoteLink}
            target="_blank"
            className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                  {quoteCode}
                </span>
                {quote.booked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/15 dark:bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="h-3 w-3" />
                    Booked
                  </span>
                ) : quote.viewed_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 dark:border-cyan-500/20 bg-cyan-500/15 dark:bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-300">
                    <Eye className="h-3 w-3" />
                    Viewed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/15 dark:bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-700 dark:text-white/70">
                {vehicleLabel} • {quote.customer_name || 'No name'}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                {new Date(quote.created_at).toLocaleDateString()} at {new Date(quote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                ${price.toFixed(2)}
              </p>
              <button className="mt-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/75 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1">
                View <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
