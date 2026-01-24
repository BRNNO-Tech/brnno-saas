'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getAutoAssignmentSettings, updateAutoAssignmentSettings } from '@/lib/actions/auto-assign'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import UpgradePrompt from '@/components/upgrade-prompt'
import { Sparkles, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'

export default function AutoAssignmentSettings() {
  const { can, tier } = useFeatureGate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<{
    enabled: boolean
    method: 'manual' | 'rule_based' | 'ai'
  }>({
    enabled: false,
    method: 'manual'
  })
  const [error, setError] = useState<string | null>(null)

  const canAutoAssign = can('basic_auto_assignment')
  const canAdvancedAutoAssign = can('advanced_auto_assignment')

  useEffect(() => {
    async function loadSettings() {
      try {
        const currentSettings = await getAutoAssignmentSettings()
        setSettings(currentSettings)
      } catch (err) {
        console.error('Error loading auto-assignment settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateAutoAssignmentSettings(settings)
      alert('Auto-assignment settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canAutoAssign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Auto-Assignment
          </CardTitle>
          <CardDescription>
            Automatically assign jobs to the best available workers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            requiredFeature="basic_auto_assignment"
            message="Auto-assignment is available on Pro and Fleet plans. Upgrade to automatically match jobs with workers based on skills, availability, and workload."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Auto-Assignment
        </CardTitle>
        <CardDescription>
          Automatically assign jobs to the best available workers based on skills, availability, and workload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {/* Enable/Disable */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="auto_assignment_enabled"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="h-4 w-4 rounded"
          />
          <Label htmlFor="auto_assignment_enabled" className="!mt-0 cursor-pointer">
            Enable auto-assignment
          </Label>
        </div>

        {settings.enabled && (
          <>
            {/* Assignment Method */}
            <div className="space-y-3">
              <Label>Assignment Method</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="method_rule_based"
                    name="assignment_method"
                    value="rule_based"
                    checked={settings.method === 'rule_based'}
                    onChange={() => setSettings({ ...settings, method: 'rule_based' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="method_rule_based" className="!mt-0 cursor-pointer flex-1">
                    <div className="font-medium">Rule-Based (Included)</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Matches jobs to workers based on skills, availability, and workload balance
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="method_ai"
                    name="assignment_method"
                    value="ai"
                    checked={settings.method === 'ai'}
                    onChange={() => setSettings({ ...settings, method: 'ai' })}
                    disabled={!canAdvancedAutoAssign}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor="method_ai" 
                    className={`!mt-0 flex-1 ${!canAdvancedAutoAssign ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-medium flex items-center gap-2">
                      AI-Powered
                      {!canAdvancedAutoAssign && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">
                          Add-on Required
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      AI learns from past assignments and optimizes routes. Requires AI Job Assignment add-on.
                    </div>
                  </Label>
                  {!canAdvancedAutoAssign && (
                    <Link href="/pricing">
                      <Button variant="outline" size="sm">
                        <Lock className="h-3 w-3 mr-1" />
                        Subscribe
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>How it works:</strong> When enabled, you can use the "Auto-Assign" button on unassigned jobs. 
                The system will match jobs to workers based on their skills, current workload, and availability.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
