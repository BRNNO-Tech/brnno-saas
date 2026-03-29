'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { CampaignRow } from '@/types/marketing'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-600/30 text-zinc-200',
    scheduled: 'bg-blue-600/30 text-blue-200',
    sent: 'bg-emerald-600/30 text-emerald-200',
    failed: 'bg-red-600/30 text-red-200',
  }
  return map[status] || 'bg-zinc-600/30 text-zinc-200'
}

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/marketing/campaigns')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        if (!cancelled) setCampaigns(data.campaigns || [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load campaigns')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="px-4 sm:px-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Campaigns
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            Email and SMS to your clients
          </p>
        </div>
        <Link href="/dashboard/marketing/campaigns/new">
          <Button className="bg-[var(--dash-amber)] text-[var(--dash-black)] hover:bg-[var(--dash-amber)]/90">
            <Plus className="h-4 w-4 mr-2" />
            New campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--dash-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-[var(--dash-text-muted)]">No campaigns yet. Create one to get started.</p>
      ) : (
        <div className="border border-[var(--dash-border)] overflow-hidden rounded-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--dash-surface)] border-b border-[var(--dash-border)]">
                <th className="text-left p-3 font-dash-condensed uppercase text-xs text-[var(--dash-text-muted)]">
                  Name
                </th>
                <th className="text-left p-3 font-dash-condensed uppercase text-xs text-[var(--dash-text-muted)]">
                  Channel
                </th>
                <th className="text-left p-3 font-dash-condensed uppercase text-xs text-[var(--dash-text-muted)]">
                  Status
                </th>
                <th className="text-left p-3 font-dash-condensed uppercase text-xs text-[var(--dash-text-muted)]">
                  Recipients
                </th>
                <th className="text-left p-3 font-dash-condensed uppercase text-xs text-[var(--dash-text-muted)]">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[var(--dash-border)] hover:bg-[var(--dash-surface)]/50">
                  <td className="p-3">
                    <Link
                      href={`/dashboard/marketing/campaigns/${c.id}`}
                      className="text-[var(--dash-amber)] hover:underline font-medium"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3 uppercase text-xs">{c.channel}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-dash-mono uppercase ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 font-dash-mono text-xs">{c.recipient_count ?? '—'}</td>
                  <td className="p-3 font-dash-mono text-xs text-[var(--dash-text-muted)]">
                    {c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
