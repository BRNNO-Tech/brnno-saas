'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const SERVICE_TYPES = [
  'Full Detail',
  'Wash & Wax',
  'Ceramic Coating',
  'Interior Detail',
  'Exterior Only',
  'Paint Correction',
  'Headlight Restoration',
  'Engine Bay',
  'Other',
]

const VEHICLE_TYPES = ['', 'Sedan', 'Truck', 'SUV', 'Van', 'Sports car', 'Classic', 'Other']

const VIBES = [
  { value: 'professional', label: 'Professional' },
  { value: 'hype', label: 'Hype' },
  { value: 'chill', label: 'Chill' },
  { value: 'funny', label: 'Funny' },
] as const

export default function CaptionGeneratorPage() {
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0])
  const [vehicleType, setVehicleType] = useState('')
  const [vibe, setVibe] = useState<(typeof VIBES)[number]['value']>('professional')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setCaptions([])
    try {
      const res = await fetch('/api/marketing/caption-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          vehicleType: vehicleType || undefined,
          vibe,
          hasPhoto,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }
      if (!Array.isArray(data.captions)) {
        throw new Error('Invalid response')
      }
      setCaptions(data.captions)
      toast.success('Captions generated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate captions')
    } finally {
      setLoading(false)
    }
  }

  async function copyCaption(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      toast.success('Copied')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-2xl">
      <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)] mb-1">
        AI caption generator
      </h1>
      <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mb-6">
        Three Instagram/Facebook style captions for your detailing posts
      </p>

      <div className="space-y-5 border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6">
        <div className="space-y-2">
          <Label className="font-dash-condensed text-xs uppercase tracking-wider">Service type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger className="bg-[var(--dash-surface)] border-[var(--dash-border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-dash-condensed text-xs uppercase tracking-wider">Vehicle type (optional)</Label>
          <Select value={vehicleType || '__none__'} onValueChange={(v) => setVehicleType(v === '__none__' ? '' : v)}>
            <SelectTrigger className="bg-[var(--dash-surface)] border-[var(--dash-border)]">
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not specified</SelectItem>
              {VEHICLE_TYPES.filter(Boolean).map((v) => (
                <SelectItem key={v} value={v!}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-dash-condensed text-xs uppercase tracking-wider">Vibe</Label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVibe(v.value)}
                className={
                  vibe === v.value
                    ? 'px-3 py-1.5 rounded-md text-sm font-dash-condensed uppercase tracking-wide bg-[var(--dash-amber-glow)] text-[var(--dash-amber)] border border-[var(--dash-amber)]/40'
                    : 'px-3 py-1.5 rounded-md text-sm font-dash-condensed uppercase tracking-wide bg-[var(--dash-surface)] text-[var(--dash-text-muted)] border border-[var(--dash-border)] hover:bg-[var(--dash-border)]'
                }
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasPhoto}
            onChange={(e) => setHasPhoto(e.target.checked)}
            className="rounded border-[var(--dash-border)]"
          />
          <span className="text-sm text-[var(--dash-text)]">I&apos;ll attach a before/after photo</span>
        </label>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full sm:w-auto bg-[var(--dash-amber)] text-[var(--dash-black)] hover:bg-[var(--dash-amber)]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            'Generate captions'
          )}
        </Button>
      </div>

      {captions.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-dash-condensed font-bold text-lg uppercase tracking-wide text-[var(--dash-text)]">
            Results
          </h2>
          {captions.map((c, i) => (
            <div
              key={i}
              className="border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <p className="text-sm text-[var(--dash-text)] whitespace-pre-wrap flex-1">{c || '(empty)'}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => copyCaption(c, i)}
                disabled={!c}
              >
                {copiedIndex === i ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2">Copy</span>
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={handleGenerate} disabled={loading}>
            Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}
