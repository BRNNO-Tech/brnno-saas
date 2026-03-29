'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AudienceFilter, CampaignRow } from '@/types/marketing'

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testInline, setTestInline] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [campaign, setCampaign] = useState<CampaignRow | null>(null)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audienceJson, setAudienceJson] = useState('{}')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/marketing/campaigns/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed')
        const c = data.campaign as CampaignRow
        if (c.status === 'sent') {
          toast.error('This campaign was already sent')
          router.replace(`/dashboard/marketing/campaigns/${id}`)
          return
        }
        if (!cancelled && c) {
          setCampaign(c)
          setName(c.name)
          setSubject(c.subject || '')
          setBody(c.body)
          setAudienceJson(JSON.stringify(c.audience_filter || {}, null, 2))
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
  }, [id, router])

  async function patchCampaign(showToast: boolean) {
    let audience_filter: AudienceFilter = {}
    try {
      audience_filter = JSON.parse(audienceJson) as AudienceFilter
    } catch {
      toast.error('Audience filter must be valid JSON')
      return false
    }
    const res = await fetch(`/api/marketing/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        subject: campaign?.channel === 'email' ? subject.trim() : null,
        body,
        audience_filter,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save')
    if (showToast) toast.success('Saved')
    setCampaign(data.campaign)
    return true
  }

  async function save() {
    setSaving(true)
    try {
      const ok = await patchCampaign(true)
      if (!ok) return
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function sendNow() {
    setSaving(true)
    try {
      const ok = await patchCampaign(false)
      if (!ok) {
        return
      }
      const res = await fetch(`/api/marketing/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      toast.success(`Sent: ${data.sent ?? 0}, failed: ${data.failed ?? 0}`)
      router.push(`/dashboard/marketing/campaigns/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSaving(false)
    }
  }

  async function sendTestToMyself() {
    setTestSending(true)
    setTestInline(null)
    try {
      const ok = await patchCampaign(false)
      if (!ok) return
      const res = await fetch(`/api/marketing/campaigns/${id}/send?test=true`, { method: 'POST' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setTestInline({ kind: 'error', text: data.error || 'Test send failed' })
        return
      }
      setTestInline({ kind: 'success', text: 'Test sent to your email/phone' })
    } catch {
      setTestInline({ kind: 'error', text: 'Test send failed' })
    } finally {
      setTestSending(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 pb-8 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (!campaign) return null

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-2xl">
      <Link
        href={`/dashboard/marketing/campaigns/${id}`}
        className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase hover:text-[var(--dash-amber)]"
      >
        ← Back
      </Link>
      <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)] mt-2">
        Edit campaign
      </h1>

      <div className="mt-6 space-y-4 border border-[var(--dash-border)] p-6 bg-[var(--dash-graphite)]">
        <div>
          <Label className="text-xs uppercase">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-[var(--dash-surface)]" />
        </div>
        {campaign.channel === 'email' && (
          <div>
            <Label className="text-xs uppercase">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 bg-[var(--dash-surface)]" />
          </div>
        )}
        <div>
          <Label className="text-xs uppercase">Body</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="mt-1 bg-[var(--dash-surface)]" />
        </div>
        <div>
          <Label className="text-xs uppercase">Audience filter (JSON)</Label>
          <Textarea
            value={audienceJson}
            onChange={(e) => setAudienceJson(e.target.value)}
            rows={5}
            className="mt-1 bg-[var(--dash-surface)] font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={save} disabled={saving || testSending}>
              Save
            </Button>
            <Button
              type="button"
              className="bg-[var(--dash-amber)] text-[var(--dash-black)]"
              onClick={sendNow}
              disabled={saving || testSending}
            >
              Save & send
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="self-start border-[var(--dash-border)] text-[var(--dash-text-muted)]"
            onClick={sendTestToMyself}
            disabled={testSending || saving}
          >
            {testSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send test to myself'
            )}
          </Button>
          {testInline && (
            <p
              className={
                testInline.kind === 'success'
                  ? 'text-sm text-[var(--dash-amber)]'
                  : 'text-sm text-red-500'
              }
              role="status"
            >
              {testInline.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
