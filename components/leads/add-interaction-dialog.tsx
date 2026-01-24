'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addLeadInteraction } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'

export default function AddInteractionDialog({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'call' | 'sms' | 'email' | 'note'>('call')
  const [content, setContent] = useState('')
  const [outcome, setOutcome] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await addLeadInteraction(leadId, type, content, outcome || undefined)
      setContent('')
      setOutcome('')
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding interaction:', error)
      alert('Failed to add interaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="call">Phone Call</option>
              <option value="sms">Text Message</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <Label>Details</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened in this interaction?"
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Outcome</Label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">Select outcome...</option>
              <option value="answered">Answered</option>
              <option value="voicemail">Left voicemail</option>
              <option value="no_response">No response</option>
              <option value="scheduled">Appointment scheduled</option>
              <option value="quoted">Sent quote</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not interested</option>
              <option value="callback_requested">Callback requested</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Interaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

