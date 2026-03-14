'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface PromoBannerProps {
  message: string
  code: string | null
  expiresAt: string | null
}

function formatExpiryDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function PromoBanner({ message, code, expiresAt }: PromoBannerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="w-full shrink-0 mt-6 mb-4">
      <div
        className="rounded-xl px-4 py-3 sm:px-5 sm:py-4 shadow-md border border-amber-300/50 dark:border-amber-600/50"
        style={{
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
          color: '#fff',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            {message && (
              <p className="font-bold text-sm sm:text-base text-white drop-shadow-sm">
                {message}
              </p>
            )}
            {expiresAt && (
              <p className="text-xs sm:text-sm text-amber-100 mt-0.5">
                Offer ends {formatExpiryDate(expiresAt)}
              </p>
            )}
          </div>
          {code && (
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm border border-white/40 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {code}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
