'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { CampaignRow } from '@/types/marketing'

type Recipient = {
  id: string
  client_id: string
  status: string
  sent_at: string | null
  error: string | null
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [campaign, setCampaign] = useState<CampaignRow | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/marketing/campaigns/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        if (!cancelled) {
          setCampaign(data.campaign)
          setRecipients(data.recipients || [])
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function duplicateCampaign() {
    if (!campaign) return
    setDuplicating(true)
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign.name} (copy)`,
          channel: campaign.channel,
          subject: campaign.subject,
          body: campaign.body,
          audience_filter: campaign.audience_filter,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const newId = data.campaign?.id
      if (newId) {
        toast.success('Duplicate created')
        router.push(`/dashboard/marketing/campaigns/${newId}/edit`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setDuplicating(false)
    }
  }

  if (loading || !campaign) {
    return (
      <div className="px-4 sm:px-6 pb-8 flex items-center gap-2 text-[var(--dash-text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  const sent = recipients.filter((r) => r.status === 'sent').length
  const failed = recipients.filter((r) => r.status === 'failed').length

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-4xl">
      <Link
        href="/dashboard/marketing/campaigns"
        className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase hover:text-[var(--dash-amber)]"
      >
        ← Campaigns
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-2">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            {campaign.name}
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider">
            {campaign.channel} · {campaign.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaign.status === 'draft' && (
            <Link href={`/dashboard/marketing/campaigns/${id}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={duplicateCampaign} disabled={duplicating}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicate
          </Button>
        </div>
      </div>

      {campaign.status === 'sent' && (
        <div className="mt-4 grid grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] max-w-md">
          <div className="bg-[var(--dash-graphite)] p-3 text-center">
            <div className="font-dash-mono text-xs text-[var(--dash-text-muted)]">Sent</div>
            <div className="font-dash-condensed text-xl text-[var(--dash-amber)]">{sent}</div>
          </div>
          <div className="bg-[var(--dash-graphite)] p-3 text-center">
            <div className="font-dash-mono text-xs text-[var(--dash-text-muted)]">Failed</div>
            <div className="font-dash-condensed text-xl text-red-400">{failed}</div>
          </div>
          <div className="bg-[var(--dash-graphite)] p-3 text-center">
            <div className="font-dash-mono text-xs text-[var(--dash-text-muted)]">Total</div>
            <div className="font-dash-condensed text-xl">{recipients.length}</div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {campaign.channel === 'email' && campaign.subject && (
          <p className="text-sm">
            <span className="text-[var(--dash-text-muted)]">Subject:</span> {campaign.subject}
          </p>
        )}
        <div className="border border-[var(--dash-border)] p-4 bg-[var(--dash-surface)] text-sm whitespace-pre-wrap">
          {campaign.body}
        </div>
      </div>

      {recipients.length > 0 && (
        <div className="mt-8">
          <h2 className="font-dash-condensed font-bold text-lg uppercase mb-2">Recipients</h2>
          <div className="border border-[var(--dash-border)] max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--dash-graphite)] border-b border-[var(--dash-border)]">
                  <th className="text-left p-2 font-dash-condensed uppercase">Client ID</th>
                  <th className="text-left p-2 font-dash-condensed uppercase">Status</th>
                  <th className="text-left p-2 font-dash-condensed uppercase">Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--dash-border)]">
                    <td className="p-2 font-mono text-[10px]">{r.client_id.slice(0, 8)}…</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 text-red-400">{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
