'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateReviewSettings } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    review_automation_enabled: true,
    review_delay_hours: 24,
    google_review_link: ''
  })

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('businesses')
        .select('review_automation_enabled, review_delay_hours, google_review_link')
        .eq('owner_id', user.id)
        .single()

      if (data) {
        setSettings({
          review_automation_enabled: data.review_automation_enabled ?? true,
          review_delay_hours: data.review_delay_hours ?? 24,
          google_review_link: data.google_review_link ?? ''
        })
      }
    }
    loadSettings()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await updateReviewSettings(formData)
      alert('Settings saved!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Configure your business settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="review_automation_enabled"
                name="review_automation_enabled"
                type="checkbox"
                value="true"
                defaultChecked={settings.review_automation_enabled}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="review_automation_enabled" className="!mt-0">
                Enable automatic review requests after job completion
              </Label>
            </div>

            <div>
              <Label htmlFor="review_delay_hours">
                Send review request after (hours)
              </Label>
              <Input
                id="review_delay_hours"
                name="review_delay_hours"
                type="number"
                min="1"
                max="168"
                defaultValue={settings.review_delay_hours}
              />
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Default: 24 hours after job completion
              </p>
            </div>

            <div>
              <Label htmlFor="google_review_link">Google Review Link</Label>
              <Input
                id="google_review_link"
                name="google_review_link"
                type="url"
                defaultValue={settings.google_review_link}
                placeholder="https://g.page/r/..."
              />
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Your Google Business review link (optional)
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

