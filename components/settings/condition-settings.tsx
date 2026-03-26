'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { Save, Plus, Trash2, Upload, X, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { ConditionConfig, ConditionTier } from '@/types/condition-config'

// PRESETS to make setup fast for them
const PRESETS = {
  winter: { label: "Winter / Mud", desc: "Heavy road salt, mud, snow, or seasonal debris." },
  beach: { label: "Sand / Surf", desc: "Sand removal, salt spray, or wet seat extraction." },
  city: { label: "Family / Pet", desc: "Pet hair, sticky spills, and food stains." },
}

const MAX_REFERENCE_PHOTOS = 2

function normalizeTiers(tiers: ConditionTier[] | undefined): ConditionTier[] {
  return (tiers || []).map((t) => {
    const raw = Array.isArray(t.reference_photos) ? t.reference_photos.filter(Boolean) : undefined
    return {
      ...t,
      reference_photos: raw && raw.length > 0 ? raw : undefined,
    }
  })
}

interface ConditionSettingsProps {
  initialConfig: ConditionConfig | null
  onSave: (config: ConditionConfig) => Promise<void>
  loading?: boolean
}

export default function ConditionSettings({ initialConfig, onSave, loading: externalLoading }: ConditionSettingsProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled || false)
  const [tiers, setTiers] = useState<ConditionTier[]>(() => normalizeTiers(initialConfig?.tiers))
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    if (initialConfig) {
      setEnabled(initialConfig.enabled)
      setTiers(normalizeTiers(initialConfig.tiers))
    }
  }, [initialConfig])

  const updateTier = (index: number, field: keyof ConditionTier, value: string | number) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setTiers(newTiers)
  }

  const setTierReferencePhotos = (index: number, urls: string[]) => {
    const newTiers = [...tiers]
    const next = urls.length > 0 ? urls : undefined
    newTiers[index] = { ...newTiers[index], reference_photos: next }
    setTiers(newTiers)
  }

  const handleReferenceUpload = async (index: number, file: File) => {
    const tier = tiers[index]
    const current = tier.reference_photos || []
    if (current.length >= MAX_REFERENCE_PHOTOS) {
      toast.error(`You can upload up to ${MAX_REFERENCE_PHOTOS} reference photos per tier`)
      return
    }
    setUploadingIndex(index)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('tierId', tier.id)
      const res = await fetch('/api/upload-condition-reference-photo', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      if (!data.url) {
        throw new Error('No URL returned')
      }
      setTierReferencePhotos(index, [...current, data.url])
      toast.success('Photo uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploadingIndex(null)
    }
  }

  const removeReferencePhoto = async (index: number, url: string) => {
    setUploadingIndex(index)
    try {
      const res = await fetch('/api/delete-condition-reference-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove photo from storage')
      }
      const tier = tiers[index]
      const next = (tier.reference_photos || []).filter((u) => u !== url)
      setTierReferencePhotos(index, next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove photo')
    } finally {
      setUploadingIndex(null)
    }
  }

  const applyPreset = (index: number, presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    updateTier(index, 'label', preset.label)
    updateTier(index, 'description', preset.desc)
    toast.success(`Applied ${presetKey} preset`)
  }

  const addTier = () => {
    const newId = `tier_${Date.now()}`
    setTiers([...tiers, { id: newId, label: '', description: '', markup_percent: 0, reference_photos: undefined }])
  }

  const removeTier = (index: number) => {
    if (tiers.length <= 1) {
      toast.error('You must have at least one condition tier')
      return
    }
    const newTiers = tiers.filter((_, i) => i !== index)
    setTiers(newTiers)
  }

  const handleSave = async () => {
    // Validate tiers
    if (enabled && tiers.length === 0) {
      toast.error('Please add at least one condition tier when enabled')
      return
    }

    for (const tier of tiers) {
      if (!tier.label.trim()) {
        toast.error('All condition tiers must have a label')
        return
      }
      if (tier.markup_percent < 0 || tier.markup_percent > 1) {
        toast.error('Markup percentage must be between 0% and 100%')
        return
      }
    }

    setSaving(true)
    try {
      const tiersPayload = tiers.map((t) => {
        const { reference_photos, ...rest } = t
        return {
          ...rest,
          ...(reference_photos && reference_photos.length > 0 ? { reference_photos } : {}),
        }
      })
      await onSave({ enabled, tiers: tiersPayload })
      toast.success('Condition settings saved successfully!')
    } catch (error: any) {
      console.error('Error saving condition settings:', error)
      toast.error(error.message || 'Failed to save condition settings')
    } finally {
      setSaving(false)
    }
  }

  const loading = saving || externalLoading

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Vehicle Condition Pricing</CardTitle>
            <CardDescription>
              Charge extra for dirty vehicles? Configure your condition tiers and markup percentages.
            </CardDescription>
          </div>
          
          {/* THE MASTER SWITCH */}
          <div className="flex items-center gap-3">
            <Label htmlFor="condition-enabled" className="text-sm font-medium">
              {enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="condition-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={loading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {enabled && (
          <div className="space-y-6">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider pb-2 border-b">
              <div className="col-span-3">Label</div>
              <div className="col-span-5">Customer Description</div>
              <div className="col-span-3">Markup %</div>
              <div className="col-span-1"></div>
            </div>

            {/* Tier Rows */}
            {tiers.map((tier, index) => (
              <div key={tier.id || index} className="space-y-3">
                <div className="grid grid-cols-12 gap-4 items-start group">
                  {/* LABEL INPUT */}
                  <div className="col-span-3 space-y-2">
                    <Input
                      type="text"
                      value={tier.label}
                      onChange={(e) => updateTier(index, 'label', e.target.value)}
                      placeholder="e.g. Disaster"
                      className="text-sm font-semibold"
                      disabled={loading}
                    />
                    {/* Preset Quick Actions */}
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPreset(index, 'winter')}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        disabled={loading}
                      >
                        Winter
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(index, 'beach')}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        disabled={loading}
                      >
                        Beach
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(index, 'city')}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        disabled={loading}
                      >
                        City
                      </button>
                    </div>
                  </div>

                  {/* DESCRIPTION INPUT */}
                  <div className="col-span-5">
                    <Textarea
                      value={tier.description}
                      onChange={(e) => updateTier(index, 'description', e.target.value)}
                      placeholder="What does this condition include?"
                      className="text-sm h-20 resize-none"
                      disabled={loading}
                    />
                  </div>

                  {/* PERCENTAGE INPUT */}
                  <div className="col-span-3 space-y-1">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tier.markup_percent ? (tier.markup_percent * 100).toFixed(1) : '0'}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          updateTier(index, 'markup_percent', value / 100)
                        }}
                        className="text-sm pr-8"
                        disabled={loading}
                      />
                      <span className="absolute right-3 top-2.5 text-zinc-400 font-bold text-sm">%</span>
                    </div>
                    <p className="text-xs text-zinc-400">Adds to base price</p>
                  </div>

                  {/* DELETE BUTTON */}
                  <div className="col-span-1 pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition"
                      disabled={loading || tiers.length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-4 py-2 rounded-r-md bg-zinc-50/80 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Images className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">
                      Customer examples (optional, max {MAX_REFERENCE_PHOTOS})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Shown on your booking page as &quot;See examples&quot; so customers know what this tier looks like.
                  </p>
                  <div className="flex flex-wrap items-start gap-3">
                    {(tier.reference_photos || []).map((url) => (
                      <div
                        key={url}
                        className="relative h-20 w-28 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 shrink-0"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeReferencePhoto(index, url)}
                          disabled={loading || uploadingIndex === index}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white hover:bg-red-600 transition"
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {(tier.reference_photos || []).length < MAX_REFERENCE_PHOTOS && (
                      <>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[index] = el
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={loading || uploadingIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) void handleReferenceUpload(index, file)
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-20 w-28 border-dashed flex flex-col gap-1 text-xs"
                          disabled={loading || uploadingIndex === index}
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadingIndex === index ? 'Uploading…' : 'Upload'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addTier}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Plus size={16} /> Add Condition Tier
            </Button>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> Use the preset buttons (Winter, Beach, City) to quickly fill in common condition descriptions. You can always edit them after.
              </p>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Condition pricing is disabled. When enabled, customers will see condition options during booking and prices will adjust based on their selection.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
