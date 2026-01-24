'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { X, Save, Loader2, TrendingUp, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { type Script } from '@/lib/actions/scripts'
import { updateScript } from '@/lib/actions/scripts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ScriptEditorPanelProps {
  script: Script
  onClose: () => void
  onScriptUpdate: (script: Script) => void
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

export function ScriptEditorPanel({ script, onScriptUpdate, onClose }: ScriptEditorPanelProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(script.name)
  const [body, setBody] = useState(script.body)
  const [subject, setSubject] = useState(script.subject || '')
  const [tone, setTone] = useState(script.tone)
  const [ctaStyle, setCtaStyle] = useState(script.cta_style)
  const [isActive, setIsActive] = useState(script.is_active)

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

    setSaving(true)
    try {
      const success = await updateScript(script.id, {
        name: name.trim(),
        body: body.trim(),
        subject: script.channel === 'email' ? subject.trim() : undefined,
        tone,
        cta_style: ctaStyle,
        is_active: isActive,
      })

      if (success) {
        toast.success('Script updated successfully')
        onScriptUpdate({
          ...script,
          name: name.trim(),
          body: body.trim(),
          subject: script.channel === 'email' ? subject.trim() : null,
          tone,
          cta_style: ctaStyle,
          is_active: isActive,
        })
      } else {
        toast.error('Failed to update script')
      }
    } catch (error) {
      console.error('Error saving script:', error)
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const replyRate = script.usage_count > 0
    ? ((script.reply_count / script.usage_count) * 100).toFixed(1)
    : '0'
  const bookingRate = script.usage_count > 0
    ? ((script.booking_count / script.usage_count) * 100).toFixed(1)
    : '0'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">{script.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {script.channel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {script.category.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Performance Metrics */}
          {script.usage_count > 0 && (
            <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-zinc-600 dark:text-white/55">Reply Rate</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{replyRate}%</p>
                    <p className="text-xs text-zinc-600 dark:text-white/55">{script.reply_count} of {script.usage_count}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-violet-600" />
                      <span className="text-xs text-zinc-600 dark:text-white/55">Booking Rate</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{bookingRate}%</p>
                    <p className="text-xs text-zinc-600 dark:text-white/55">{script.booking_count} bookings</p>
                  </div>
                </div>
                {script.avg_time_to_book && (
                  <div className="rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-cyan-600" />
                      <span className="text-xs text-zinc-600 dark:text-white/55">Avg Time to Book</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {Math.round(script.avg_time_to_book / 60)} hours
                    </p>
                  </div>
                )}
                {script.total_revenue > 0 && (
                  <div className="rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-zinc-600 dark:text-white/55">Total Revenue</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      ${script.total_revenue.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Editor */}
          <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-sm">Edit Script</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="script-name">Name</Label>
                <Input
                  id="script-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              {script.channel === 'email' && (
                <div>
                  <Label htmlFor="script-subject">Email Subject</Label>
                  <Input
                    id="script-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Follow-up on your quote"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="script-body">Message Body *</Label>
                <Textarea
                  id="script-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="mt-1 min-h-[120px] font-mono text-sm"
                  rows={6}
                />
                {script.channel === 'sms' && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                    {body.length} / 160 characters
                  </p>
                )}
              </div>

              <div>
                <Label>Personalization Tokens</Label>
                <div className="mt-2 flex flex-wrap gap-2">
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

              <div>
                <Label>Tone</Label>
                <div className="mt-2 flex gap-2">
                  {(['friendly', 'premium', 'direct'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs transition-all duration-150 capitalize',
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
                <Label>CTA Style</Label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(['booking_link', 'question', 'both', 'none'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setCtaStyle(style)}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs transition-all duration-150',
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
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
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
