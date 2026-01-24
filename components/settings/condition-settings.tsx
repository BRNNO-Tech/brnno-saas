'use client'

import React, { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// PRESETS to make setup fast for them
const PRESETS = {
  winter: { label: "Winter / Mud", desc: "Heavy road salt, mud, snow, or seasonal debris." },
  beach: { label: "Sand / Surf", desc: "Sand removal, salt spray, or wet seat extraction." },
  city: { label: "Family / Pet", desc: "Pet hair, sticky spills, and food stains." },
}

type ConditionTier = {
  id: string
  label: string
  description: string
  markup_percent: number
}

type ConditionConfig = {
  enabled: boolean
  tiers: ConditionTier[]
}

interface ConditionSettingsProps {
  initialConfig: ConditionConfig | null
  onSave: (config: ConditionConfig) => Promise<void>
  loading?: boolean
}

export default function ConditionSettings({ initialConfig, onSave, loading: externalLoading }: ConditionSettingsProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled || false)
  const [tiers, setTiers] = useState<ConditionTier[]>(initialConfig?.tiers || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialConfig) {
      setEnabled(initialConfig.enabled)
      setTiers(initialConfig.tiers || [])
    }
  }, [initialConfig])

  const updateTier = (index: number, field: keyof ConditionTier, value: string | number) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setTiers(newTiers)
  }

  const applyPreset = (index: number, presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    updateTier(index, 'label', preset.label)
    updateTier(index, 'description', preset.desc)
    toast.success(`Applied ${presetKey} preset`)
  }

  const addTier = () => {
    const newId = `tier_${Date.now()}`
    setTiers([...tiers, { id: newId, label: '', description: '', markup_percent: 0 }])
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
      await onSave({ enabled, tiers })
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
              <div key={tier.id || index} className="grid grid-cols-12 gap-4 items-start group">
                
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
                  <p className="text-xs text-zinc-400">
                    Adds to base price
                  </p>
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
