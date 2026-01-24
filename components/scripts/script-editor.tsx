'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2 } from 'lucide-react'
import { createScript, updateScript, type Script, type ScriptFormData } from '@/lib/actions/scripts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ScriptEditorProps {
  mode: 'create' | 'edit'
  script?: Script
}

const personalizationTokens = [
  { token: '{name}', description: 'Lead name' },
  { token: '{first_name}', description: 'First name only' },
  { token: '{service}', description: 'Service name' },
  { token: '{vehicle}', description: 'Vehicle type' },
  { token: '{booking_link}', description: 'Booking link' },
  { token: '{price}', description: 'Service price' },
  { token: '{business_name}', description: 'Your business name' },
]

const categories = [
  { value: 'new_lead_instant_reply', label: 'New Lead Instant Reply' },
  { value: 'quote_follow_up', label: 'Quote Follow-up' },
  { value: 'missed_call_text_back', label: 'Missed Call Text-back' },
  { value: 'shopping_around', label: 'Shopping Around' },
  { value: 'incentive_offer', label: 'Incentive Offer' },
  { value: 'break_up_message', label: 'Break-up Message' },
  { value: 'reactivation', label: 'Reactivation' },
  { value: 'custom', label: 'Custom' },
]

export function ScriptEditor({ mode, script }: ScriptEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(script?.name || '')
  const [category, setCategory] = useState<ScriptFormData['category']>(script?.category || 'new_lead_instant_reply')
  const [channel, setChannel] = useState<ScriptFormData['channel']>(script?.channel || 'sms')
  const [body, setBody] = useState(script?.body || '')
  const [subject, setSubject] = useState(script?.subject || '')
  const [tone, setTone] = useState<ScriptFormData['tone']>(script?.tone || 'friendly')
  const [ctaStyle, setCtaStyle] = useState<ScriptFormData['cta_style']>(script?.cta_style || 'booking_link')
  const [isActive, setIsActive] = useState(script?.is_active ?? true)

  const handleTokenClick = (token: string) => {
    setBody(body + token)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a script name')
      return
    }
    if (!body.trim()) {
      toast.error('Please enter script content')
      return
    }
    if (channel === 'email' && !subject.trim()) {
      toast.error('Please enter an email subject')
      return
    }

    setSaving(true)
    try {
      const scriptData: ScriptFormData = {
        name: name.trim(),
        category,
        channel,
        body: body.trim(),
        subject: channel === 'email' ? subject.trim() : undefined,
        tone,
        cta_style: ctaStyle,
        is_active: isActive,
      }

      if (mode === 'create') {
        const result = await createScript(scriptData)
        if (result) {
          toast.success('Script created successfully')
          router.push(`/dashboard/leads/scripts`)
        } else {
          toast.error('Failed to create script')
        }
      } else if (script) {
        const success = await updateScript(script.id, scriptData)
        if (success) {
          toast.success('Script updated successfully')
          router.refresh()
        } else {
          toast.error('Failed to update script')
        }
      }
    } catch (error) {
      console.error('Error saving script:', error)
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Settings */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Script Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Lead Welcome SMS"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="channel">Channel *</Label>
              <div className="mt-2 flex gap-2">
                {(['sms', 'email'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded text-sm transition-all duration-150 uppercase',
                      channel === ch
                        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm'
                        : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent'
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Tone *</Label>
              <div className="mt-2 flex gap-2">
                {(['friendly', 'premium', 'direct'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded text-sm transition-all duration-150 capitalize',
                      tone === t
                        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm'
                        : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>CTA Style *</Label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(['booking_link', 'question', 'both', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCtaStyle(style)}
                    className={cn(
                      'px-3 py-2 rounded text-sm transition-all duration-150',
                      ctaStyle === style
                        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm'
                        : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent'
                    )}
                  >
                    {style.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="is-active">Active</Label>
                <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                  Script is available for use
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !body.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Script' : 'Save Changes'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Script Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channel === 'email' && (
              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Follow-up on your quote"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="body">Message Body *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Type your ${channel === 'sms' ? 'SMS' : 'email'} message here...`}
                className="mt-1 min-h-[200px] font-mono text-sm"
                rows={10}
              />
              {channel === 'sms' && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                  {body.length} / 160 characters
                  {body.length > 160 && (
                    <span className="text-orange-600 dark:text-orange-400 ml-2">
                      (SMS will be split into multiple messages)
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <Label>Personalization Tokens</Label>
              <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5 mb-2">
                Click tokens to insert them into your message
              </p>
              <div className="flex flex-wrap gap-2">
                {personalizationTokens.map(({ token, description }) => (
                  <button
                    key={token}
                    onClick={() => handleTokenClick(token)}
                    className="rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-mono text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-colors"
                    title={description}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
