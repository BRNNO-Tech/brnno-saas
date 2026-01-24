'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type TimeBlockData = {
  title: string
  start_time: string
  end_time: string
  type: 'personal' | 'holiday' | 'unavailable'
  description?: string | null
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_end_date?: string | null
  recurrence_count?: number | null
}

export default function AddTimeBlockDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TimeBlockData) => void
}) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    title: '',
    start_date: today,
    start_time: '',
    end_date: today,
    end_time: '',
    type: 'personal' as 'personal' | 'holiday' | 'unavailable',
    description: '',
    is_recurring: false,
    recurrence_pattern: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly' | '',
    recurrence_end_date: '',
    recurrence_count: '',
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        start_date: today,
        start_time: '',
        end_date: today,
        end_time: '',
        type: 'personal',
        description: '',
        is_recurring: false,
        recurrence_pattern: 'daily',
        recurrence_end_date: '',
        recurrence_count: '',
      })
    }
  }, [open, today])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate that all required fields are filled
      if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
        alert('Please fill in all date and time fields.')
        setLoading(false)
        return
      }

      // Combine date and time (treat as local time, not UTC)
      // Create date strings in local timezone format
      const startDateTimeStr = `${formData.start_date}T${formData.start_time}:00`
      const endDateTimeStr = `${formData.end_date}T${formData.end_time}:00`
      
      // Parse as local time (not UTC)
      const startDateTime = new Date(startDateTimeStr)
      const endDateTime = new Date(endDateTimeStr)

      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error('Invalid date parsing:', {
          startDateTimeStr,
          endDateTimeStr,
          startDateTime: startDateTime.toString(),
          endDateTime: endDateTime.toString()
        })
        alert('Invalid date or time. Please check your input.')
        setLoading(false)
        return
      }

      if (startDateTime >= endDateTime) {
        alert('End time must be after start time')
        setLoading(false)
        return
      }

      console.log('[AddTimeBlock] Creating time block:', {
        title: formData.title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type: formData.type,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.recurrence_pattern
      })

      onSubmit({
        title: formData.title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: formData.type,
        description: formData.description || null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern as any : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        recurrence_count: formData.is_recurring && formData.recurrence_count ? parseInt(formData.recurrence_count) : null,
      })

      // Reset form
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        start_date: today,
        start_time: '',
        end_date: today,
        end_time: '',
        type: 'personal',
        description: '',
        is_recurring: false,
        recurrence_pattern: 'daily',
        recurrence_end_date: '',
        recurrence_count: '',
      })
    } catch (error) {
      console.error('Error submitting time block:', error)
    } finally {
      setLoading(false)
    }
  }

  const defaultStartDate = formData.start_date || today
  const defaultEndDate = formData.end_date || today

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Block Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Gym time, Sick, Vacation"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="personal">Personal Time</option>
              <option value="holiday">Holiday</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || defaultStartDate}
                onChange={(e) => {
                  setFormData({ ...formData, start_date: e.target.value })
                  if (!formData.end_date) {
                    setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value })
                  }
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || defaultEndDate}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="is_recurring" className="!mt-0">
              Make this recurring
            </Label>
          </div>

          {formData.is_recurring && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="recurrence_pattern">Repeat</Label>
                <select
                  id="recurrence_pattern"
                  value={formData.recurrence_pattern}
                  onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value as any })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required={formData.is_recurring}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrence_end_date">End Date (optional)</Label>
                  <Input
                    id="recurrence_end_date"
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    min={formData.start_date}
                  />
                </div>
                <div>
                  <Label htmlFor="recurrence_count">Number of occurrences (optional)</Label>
                  <Input
                    id="recurrence_count"
                    type="number"
                    min="1"
                    value={formData.recurrence_count}
                    onChange={(e) => setFormData({ ...formData, recurrence_count: e.target.value })}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Leave both empty to repeat indefinitely
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
