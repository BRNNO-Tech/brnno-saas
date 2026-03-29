'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AudienceFilter } from '@/types/marketing'

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null)
  const [testSending, setTestSending] = useState(false)
  const [testInline, setTestInline] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState('')
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [audienceAll, setAudienceAll] = useState(true)
  const [lastSeenDays, setLastSeenDays] = useState<string>('')
  const [serviceType, setServiceType] = useState('')
  const [minSpend, setMinSpend] = useState('')

  function buildAudienceFilter(): AudienceFilter {
    if (audienceAll) return { all: true }
    const f: AudienceFilter = {}
    if (lastSeenDays === '30') f.lastSeenDays = 30
    else if (lastSeenDays === '60') f.lastSeenDays = 60
    else if (lastSeenDays === '90') f.lastSeenDays = 90
    if (serviceType.trim()) f.serviceType = serviceType.trim()
    const m = parseFloat(minSpend)
    if (!Number.isNaN(m) && m > 0) f.minSpend = m
    return f
  }

  async function refreshPreview() {
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/marketing/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience_filter: buildAudienceFilter(),
          channel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setPreviewCount(typeof data.count === 'number' ? data.count : 0)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed')
      setPreviewCount(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleCreate(sendAfter: boolean) {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (channel === 'email' && !subject.trim()) {
      toast.error('Subject is required for email')
      return
    }
    if (!body.trim()) {
      toast.error('Message body is required')
      return
    }

    setSaving(true)
    try {
      const audience_filter = buildAudienceFilter()
      const patchBody = {
        name: name.trim(),
        channel,
        subject: channel === 'email' ? subject.trim() : null,
        body: body.trim(),
        audience_filter,
      }

      let id = savedCampaignId
      if (!id) {
        const res = await fetch('/api/marketing/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: patchBody.name,
            channel,
            subject: channel === 'email' ? subject.trim() : undefined,
            body: patchBody.body,
            audience_filter,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create')
        const newId = data.campaign?.id as string | undefined
        if (!newId) throw new Error('No campaign id')
        id = newId
      } else {
        const res = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to save')
      }

      if (sendAfter) {
        const sendRes = await fetch(`/api/marketing/campaigns/${id}/send`, { method: 'POST' })
        const sendData = await sendRes.json()
        if (!sendRes.ok) throw new Error(sendData.error || 'Send failed')
        toast.success(`Sent: ${sendData.sent ?? 0}, failed: ${sendData.failed ?? 0}`)
        router.push(`/dashboard/marketing/campaigns/${id}`)
      } else {
        toast.success('Campaign saved as draft')
        setSavedCampaignId(id)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function sendTestToMyself() {
    if (!savedCampaignId) return
    setTestSending(true)
    setTestInline(null)
    try {
      const res = await fetch(
        `/api/marketing/campaigns/${savedCampaignId}/send?test=true`,
        { method: 'POST' }
      )
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

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/marketing/campaigns"
          className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase hover:text-[var(--dash-amber)]"
        >
          ← Campaigns
        </Link>
        <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)] mt-2">
          New campaign
        </h1>
        <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
          Step {step} of 3
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4 border border-[var(--dash-border)] p-6 bg-[var(--dash-graphite)]">
          <h2 className="font-dash-condensed font-bold text-lg uppercase">Audience</h2>
          <div className="flex gap-2 pb-2">
            <span className="text-xs uppercase text-[var(--dash-text-muted)] mr-2">Channel</span>
            <button
              type="button"
              className={
                channel === 'email'
                  ? 'px-2 py-1 rounded text-xs uppercase bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]'
                  : 'px-2 py-1 rounded text-xs uppercase border border-[var(--dash-border)]'
              }
              onClick={() => setChannel('email')}
            >
              Email
            </button>
            <button
              type="button"
              className={
                channel === 'sms'
                  ? 'px-2 py-1 rounded text-xs uppercase bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]'
                  : 'px-2 py-1 rounded text-xs uppercase border border-[var(--dash-border)]'
              }
              onClick={() => setChannel('sms')}
            >
              SMS
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={audienceAll} onChange={() => setAudienceAll(true)} />
            <span>All customers (with {channel === 'email' ? 'email' : 'phone'})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!audienceAll} onChange={() => setAudienceAll(false)} />
            <span>Filter by activity / spend</span>
          </label>
          {!audienceAll && (
            <div className="space-y-3 pl-6 border-l border-[var(--dash-border)]">
              <div>
                <Label className="text-xs uppercase">Haven&apos;t booked in (days)</Label>
                <Select value={lastSeenDays || '__none__'} onValueChange={(v) => setLastSeenDays(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1 bg-[var(--dash-surface)]">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Any</SelectItem>
                    <SelectItem value="30">30+</SelectItem>
                    <SelectItem value="60">60+</SelectItem>
                    <SelectItem value="90">90+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase">Service name contains</Label>
                <Input
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Ceramic"
                  className="mt-1 bg-[var(--dash-surface)]"
                />
              </div>
              <div>
                <Label className="text-xs uppercase">Min total spend ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="mt-1 bg-[var(--dash-surface)]"
                />
              </div>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={refreshPreview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Preview reach
          </Button>
          {previewCount !== null && (
            <p className="font-dash-mono text-xs text-[var(--dash-amber)]">
              ~{previewCount} recipient{previewCount === 1 ? '' : 's'}
            </p>
          )}
          <Button type="button" className="bg-[var(--dash-amber)] text-[var(--dash-black)]" onClick={() => setStep(2)}>
            Next
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 border border-[var(--dash-border)] p-6 bg-[var(--dash-graphite)]">
          <h2 className="font-dash-condensed font-bold text-lg uppercase">Channel & message</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className={
                channel === 'email'
                  ? 'px-3 py-1.5 rounded bg-[var(--dash-amber-glow)] text-[var(--dash-amber)] text-sm uppercase'
                  : 'px-3 py-1.5 rounded border border-[var(--dash-border)] text-sm uppercase'
              }
              onClick={() => setChannel('email')}
            >
              Email
            </button>
            <button
              type="button"
              className={
                channel === 'sms'
                  ? 'px-3 py-1.5 rounded bg-[var(--dash-amber-glow)] text-[var(--dash-amber)] text-sm uppercase'
                  : 'px-3 py-1.5 rounded border border-[var(--dash-border)] text-sm uppercase'
              }
              onClick={() => setChannel('sms')}
            >
              SMS
            </button>
          </div>
          {channel === 'email' && (
            <div>
              <Label className="text-xs uppercase">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 bg-[var(--dash-surface)]" />
            </div>
          )}
          <div>
            <Label className="text-xs uppercase">{channel === 'email' ? 'Body' : 'Message (SMS)'}</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={channel === 'email' ? 8 : 4}
              className="mt-1 bg-[var(--dash-surface)] font-mono text-sm"
              placeholder={channel === 'sms' ? 'Max ~160 characters recommended' : ''}
            />
          </div>
          <div>
            <Label className="text-xs uppercase">Internal name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-[var(--dash-surface)]" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" className="bg-[var(--dash-amber)] text-[var(--dash-black)]" onClick={() => setStep(3)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 border border-[var(--dash-border)] p-6 bg-[var(--dash-graphite)]">
          <h2 className="font-dash-condensed font-bold text-lg uppercase">Review</h2>
          <p className="text-sm text-[var(--dash-text)]">
            <strong>{name}</strong> — {channel.toUpperCase()}
          </p>
          <p className="text-sm text-[var(--dash-text-muted)] whitespace-pre-wrap">{body}</p>
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={saving}>
                Back
              </Button>
              <Button type="button" variant="outline" onClick={() => handleCreate(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save draft
              </Button>
              <Button
                type="button"
                className="bg-[var(--dash-amber)] text-[var(--dash-black)]"
                onClick={() => handleCreate(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send now
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="self-start border-[var(--dash-border)] text-[var(--dash-text-muted)]"
              onClick={sendTestToMyself}
              disabled={!savedCampaignId || testSending}
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
      )}
    </div>
  )
}
