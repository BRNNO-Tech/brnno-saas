'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function MarketingUpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/create-module-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'marketing', interval }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to start checkout')
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      throw new Error('No checkout URL returned')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)]">
        <DialogHeader>
          <DialogTitle className="font-dash-condensed font-extrabold text-[18px] uppercase tracking-wider text-[var(--dash-amber)]">
            Unlock Marketing Suite
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Grow your detailing business with powerful marketing tools
          </p>

          <ul className="space-y-2">
            {[
              'Email & SMS Campaigns',
              'AI Caption Generator',
              'Meta (Facebook & Instagram) Lead Ads',
              'Lead Source Analytics',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <span className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-green)]">✓</span>
                <span className="text-sm text-[var(--dash-text)]">{text}</span>
              </li>
            ))}
          </ul>

          <div className="border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-3">
            <div className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
              Pricing
            </div>
            <div className="font-dash-condensed font-extrabold text-[22px] text-[var(--dash-text)]">
              {interval === 'monthly' ? '$30/month' : '$25/month'}
            </div>
            <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
              {interval === 'monthly' ? 'or $25/month billed annually' : '$300/year billed annually'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
              Billing
            </span>
            <div className="flex border border-[var(--dash-border)] bg-[var(--dash-surface)] p-1">
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                className={
                  interval === 'monthly'
                    ? 'px-3 py-1 font-dash-condensed font-bold text-[12px] uppercase tracking-wider bg-[var(--dash-amber)] text-[var(--dash-black)]'
                    : 'px-3 py-1 font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]'
                }
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval('annual')}
                className={
                  interval === 'annual'
                    ? 'px-3 py-1 font-dash-condensed font-bold text-[12px] uppercase tracking-wider bg-[var(--dash-amber)] text-[var(--dash-black)]'
                    : 'px-3 py-1 font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]'
                }
              >
                Annual
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:border-[var(--dash-text)] hover:text-[var(--dash-text)] transition-colors"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="h-10 px-4 inline-flex items-center justify-center bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-extrabold text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Upgrade Now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

