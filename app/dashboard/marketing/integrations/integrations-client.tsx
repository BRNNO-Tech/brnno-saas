'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CampaignRow, IntegrationAutomations } from '@/types/marketing'

type StatusPayload = {
  integration: {
    id: string
    page_name: string
    connected_at: string
    is_active: boolean
    automations: IntegrationAutomations
  } | null
  leadsLast7Days: number
  integrationAllowed: boolean
}

type LeadRow = {
  id: string
  created_at: string
  status: string
  ad_name: string | null
  name: string | null
  error: string | null
}

const defaultAutomations: IntegrationAutomations = {
  createCrmRecord: true,
  fireSmsAgent: true,
  sendWelcomeEmail: true,
  addToNurtureCampaign: false,
  nurtureCampaignId: null,
}

export default function MarketingIntegrationsPageClient() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [automations, setAutomations] = useState<IntegrationAutomations>(defaultAutomations)
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [disconnecting, setDisconnecting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [st, ld, cp] = await Promise.all([
        fetch('/api/integrations/meta/status').then((r) => r.json()),
        fetch('/api/integrations/meta/leads?limit=20').then((r) => r.json()),
        fetch('/api/marketing/campaigns?status=sent,draft').then((r) => r.json()),
      ])
      if (st.error) throw new Error(st.error)
      if (ld.error) throw new Error(ld.error)
      setStatus({
        integration: st.integration,
        leadsLast7Days: st.leadsLast7Days ?? 0,
        integrationAllowed: st.integrationAllowed !== false,
      })
      setLeads(ld.leads || [])
      const all = (cp.campaigns || []) as CampaignRow[]
      setCampaigns(all.filter((c) => c.channel === 'email'))
      if (st.integration?.automations) {
        const a = st.integration.automations as IntegrationAutomations
        setAutomations({
          createCrmRecord: a.createCrmRecord !== false,
          fireSmsAgent: a.fireSmsAgent !== false,
          sendWelcomeEmail: a.sendWelcomeEmail !== false,
          addToNurtureCampaign: a.addToNurtureCampaign === true,
          nurtureCampaignId: a.nurtureCampaignId ?? null,
        })
      } else {
        setAutomations(defaultAutomations)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const c = searchParams.get('connected')
    const err = searchParams.get('error')
    if (c === 'true') toast.success('Facebook connected successfully!')
    if (err === 'access_denied') toast.error('Connection cancelled.')
    if (err && err !== 'access_denied') toast.error(`Connection issue: ${err.replace(/_/g, ' ')}`)
  }, [searchParams])

  const scheduleSaveAutomations = useCallback((next: IntegrationAutomations) => {
    setAutomations(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/integrations/meta/automations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to save')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save automations')
      }
    }, 500)
  }, [])

  async function disconnect() {
    if (!window.confirm('Disconnect Facebook and stop receiving Meta leads into BRNNO?')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/integrations/meta/disconnect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Disconnected')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Disconnect failed')
    } finally {
      setDisconnecting(false)
    }
  }

  const connected =
    status?.integration && status.integration.is_active && status.integration.page_name

  if (loading && status === null) {
    return (
      <div className="px-4 sm:px-6 pb-8 flex items-center gap-2 text-[var(--dash-text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (!status) {
    return (
      <div className="px-4 sm:px-6 pb-8 text-sm text-[var(--dash-text-muted)]">
        Could not load integrations. Try again later.
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-3xl">
      <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
        Integrations
      </h1>
      <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-1 mb-6">
        Connect your marketing channels to automatically capture leads.
      </p>

      {!status?.integrationAllowed && (
        <div className="mb-6 border border-[var(--dash-border)] p-4 bg-[var(--dash-graphite)] rounded">
          <p className="text-sm text-[var(--dash-text)]">
            Meta lead capture is available on Pro and higher plans.
          </p>
          <Link
            href="/dashboard/settings/subscription"
            className="inline-block mt-2 font-dash-mono text-xs uppercase text-[var(--dash-amber)] hover:underline"
          >
            View plans
          </Link>
        </div>
      )}

      <section className="border border-[var(--dash-border)] p-6 bg-[var(--dash-graphite)] space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--dash-border)] bg-[var(--dash-surface)] text-lg"
            aria-hidden
          >
            <span className="font-bold text-[#1877F2]">f</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-dash-condensed font-bold text-lg uppercase text-[var(--dash-text)]">
              Facebook &amp; Instagram Leads
            </h2>
            <p className="text-sm text-[var(--dash-text-muted)] mt-0.5">
              Automatically capture leads from your Meta ads into your CRM.
            </p>
          </div>
        </div>

        {!connected ? (
          <>
            <span className="inline-block rounded px-2 py-0.5 text-xs uppercase bg-[var(--dash-border)] text-[var(--dash-text-muted)]">
              Not connected
            </span>
            {status?.integrationAllowed ? (
              <div>
                <Button
                  type="button"
                  className="bg-[var(--dash-amber)] text-[var(--dash-black)]"
                  onClick={() => {
                    window.location.href = '/api/integrations/meta/connect'
                  }}
                >
                  Connect Facebook
                </Button>
              </div>
            ) : null}
            <ul className="text-sm text-[var(--dash-text-muted)] list-disc pl-5 space-y-1">
              <li>Create CRM contact from each lead</li>
              <li>Optional AI follow-up SMS</li>
              <li>Optional welcome email with booking link</li>
              <li>Optional add to an email nurture campaign</li>
            </ul>
          </>
        ) : (
          <>
            <span className="inline-block rounded px-2 py-0.5 text-xs uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
              Connected
            </span>
            <p className="text-sm text-[var(--dash-text)]">
              Connected to: <strong>{status!.integration!.page_name}</strong>
            </p>
            <p className="font-dash-mono text-xs text-[var(--dash-text-muted)]">
              Since {new Date(status!.integration!.connected_at).toLocaleString()}
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-red-900/50 text-red-400 hover:bg-red-950/30"
              disabled={disconnecting}
              onClick={disconnect}
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Disconnect
            </Button>

            <div className="pt-4 border-t border-[var(--dash-border)]">
              <h3 className="font-dash-condensed font-bold text-sm uppercase text-[var(--dash-text)] mb-3">
                When a lead comes in:
              </h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automations.createCrmRecord}
                    onChange={(e) =>
                      scheduleSaveAutomations({
                        ...automations,
                        createCrmRecord: e.target.checked,
                      })
                    }
                  />
                  <span>Create CRM contact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automations.fireSmsAgent}
                    onChange={(e) =>
                      scheduleSaveAutomations({
                        ...automations,
                        fireSmsAgent: e.target.checked,
                      })
                    }
                  />
                  <span>Send AI follow-up SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automations.sendWelcomeEmail}
                    onChange={(e) =>
                      scheduleSaveAutomations({
                        ...automations,
                        sendWelcomeEmail: e.target.checked,
                      })
                    }
                  />
                  <span>Send welcome email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automations.addToNurtureCampaign}
                    onChange={(e) =>
                      scheduleSaveAutomations({
                        ...automations,
                        addToNurtureCampaign: e.target.checked,
                        nurtureCampaignId: e.target.checked ? automations.nurtureCampaignId : null,
                      })
                    }
                  />
                  <span>Add to nurture campaign</span>
                </label>
                {automations.addToNurtureCampaign && (
                  <div className="pl-6">
                    <select
                      className="mt-1 w-full max-w-md rounded border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 text-sm"
                      value={automations.nurtureCampaignId || ''}
                      onChange={(e) =>
                        scheduleSaveAutomations({
                          ...automations,
                          nurtureCampaignId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Select campaign…</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--dash-border)]">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h3 className="font-dash-condensed font-bold text-sm uppercase text-[var(--dash-text)]">
                  Recent Leads
                </h3>
                <span className="font-dash-mono text-[10px] uppercase text-[var(--dash-text-muted)]">
                  Last 7 days
                </span>
                <span className="rounded-full bg-[var(--dash-amber-glow)] px-2 py-0.5 text-xs text-[var(--dash-amber)]">
                  {status?.leadsLast7Days ?? 0}
                </span>
              </div>
              {leads.length === 0 ? (
                <p className="text-sm text-[var(--dash-text-muted)] py-4">
                  No leads received yet. Make sure your Meta Lead Ad is live.
                </p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--dash-border)] text-[var(--dash-text-muted)] font-dash-mono text-[10px] uppercase">
                        <th className="py-2 pr-2">Date</th>
                        <th className="py-2 pr-2">Name</th>
                        <th className="py-2 pr-2">Source Ad</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--dash-border)]/60">
                          <td className="py-2 pr-2 text-[var(--dash-text-muted)]">
                            {new Date(row.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-2 text-[var(--dash-text)]">{row.name || '—'}</td>
                          <td className="py-2 pr-2 text-[var(--dash-text-muted)]">
                            {row.ad_name || '—'}
                          </td>
                          <td className="py-2">
                            {row.status === 'processed' && (
                              <span className="text-emerald-500 text-xs uppercase">Processed</span>
                            )}
                            {row.status === 'failed' && (
                              <span className="text-red-500 text-xs uppercase">Failed</span>
                            )}
                            {row.status === 'pending' && (
                              <span className="text-[var(--dash-text-muted)] text-xs uppercase">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

