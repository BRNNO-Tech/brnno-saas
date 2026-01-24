'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { type SequenceStep } from '@/lib/actions/sequences'
import { cn } from '@/lib/utils'

interface StepEditorProps {
  step: SequenceStep
  stepIndex: number
  onUpdate: (updates: Partial<SequenceStep>) => void
  onClose: () => void
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

export function StepEditor({ step, stepIndex, onUpdate, onClose }: StepEditorProps) {
  const handleTokenClick = (token: string) => {
    if (step.step_type === 'send_sms' || step.step_type === 'send_email') {
      const currentMessage = step.message_template || ''
      onUpdate({
        message_template: currentMessage + token,
      })
    }
  }

  return (
    <Card className="border-violet-500/30 dark:border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Step {stepIndex + 1}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Send SMS/Email Steps */}
        {(step.step_type === 'send_sms' || step.step_type === 'send_email') && (
          <>
            {step.step_type === 'send_email' && (
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={step.subject || ''}
                  onChange={(e) => onUpdate({ subject: e.target.value })}
                  placeholder="e.g., Follow-up on your quote"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="message">Message Template *</Label>
              <Textarea
                id="message"
                value={step.message_template}
                onChange={(e) => onUpdate({ message_template: e.target.value })}
                placeholder={`Type your ${step.step_type === 'send_sms' ? 'SMS' : 'email'} message here...`}
                className="mt-1 min-h-[120px] font-mono text-sm"
                rows={6}
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                {step.step_type === 'send_sms' && 'Keep SMS messages under 160 characters for best delivery'}
              </p>
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
              <p className="mt-2 text-xs text-zinc-600 dark:text-white/55">
                Click tokens to insert them into your message
              </p>
            </div>
          </>
        )}

        {/* Wait Step */}
        {step.step_type === 'wait' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delay-value">Delay Value</Label>
              <Input
                id="delay-value"
                type="number"
                min="1"
                value={step.delay_value || ''}
                onChange={(e) => onUpdate({ delay_value: parseInt(e.target.value) || null })}
                placeholder="e.g., 24"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="delay-unit">Unit</Label>
              <select
                id="delay-unit"
                value={step.delay_unit || 'hours'}
                onChange={(e) => onUpdate({ delay_unit: e.target.value as 'minutes' | 'hours' | 'days' })}
                className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Add Tag Step */}
        {step.step_type === 'add_tag' && (
          <div>
            <Label htmlFor="tag-name">Tag Name</Label>
            <Input
              id="tag-name"
              value={step.tag_name || ''}
              onChange={(e) => onUpdate({ tag_name: e.target.value })}
              placeholder="e.g., Follow-up needed"
              className="mt-1"
            />
          </div>
        )}

        {/* Change Status Step */}
        {step.step_type === 'change_status' && (
          <div>
            <Label htmlFor="status-value">New Status</Label>
            <select
              id="status-value"
              value={step.status_value || ''}
              onChange={(e) => onUpdate({ status_value: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">Select status...</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="quoted">Quoted</option>
              <option value="booked">Booked</option>
              <option value="lost">Lost</option>
              <option value="dnc">Do Not Contact</option>
            </select>
          </div>
        )}

        {/* Condition Step */}
        {step.step_type === 'condition' && (
          <div>
            <Label htmlFor="condition-type">Condition Type</Label>
            <select
              id="condition-type"
              value={step.condition_type || ''}
              onChange={(e) => onUpdate({ condition_type: e.target.value as any })}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">Select condition...</option>
              <option value="replied">If Lead Replied</option>
              <option value="clicked_booking">If Clicked Booking Link</option>
              <option value="no_reply">If No Reply</option>
            </select>
            <p className="mt-2 text-xs text-zinc-600 dark:text-white/55">
              Condition steps will branch the sequence based on lead behavior
            </p>
          </div>
        )}

        {/* Notify User Step */}
        {step.step_type === 'notify_user' && (
          <div>
            <Label htmlFor="notification-message">Notification Message</Label>
            <Textarea
              id="notification-message"
              value={step.message_template}
              onChange={(e) => onUpdate({ message_template: e.target.value })}
              placeholder="What should the notification say?"
              className="mt-1"
              rows={3}
            />
            <p className="mt-2 text-xs text-zinc-600 dark:text-white/55">
              You'll be notified when this step executes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
