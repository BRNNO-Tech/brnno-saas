'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { updateLeadNotes } from '@/lib/actions/leads'
import { toast } from 'sonner'

interface LeadNotesTabProps {
  leadId: string
  initialNotes: string | null
}

export function LeadNotesTab({ leadId, initialNotes }: LeadNotesTabProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setNotes(initialNotes || '')
    setHasChanges(false)
  }, [initialNotes])

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setHasChanges(value !== (initialNotes || ''))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateLeadNotes(leadId, notes)
      setHasChanges(false)
      toast.success('Notes saved successfully')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-zinc-900 dark:text-white mb-2 block">
          Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes about this lead..."
          className="min-h-[200px] resize-none"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          Keep track of important information, conversations, or follow-up items for this lead.
        </p>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
