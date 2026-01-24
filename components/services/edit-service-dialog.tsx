'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateService } from '@/lib/actions/services'

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
}

export default function EditServiceDialog({ 
  service, 
  open, 
  onOpenChange 
}: { 
  service: Service
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const hoursInput = formData.get('duration_minutes') as string
      const hours = hoursInput ? parseFloat(hoursInput) : undefined
      // Convert hours to minutes for storage, but only if valid (> 0)
      const minutes = hours !== undefined && hours > 0 ? Math.round(hours * 60) : undefined
      
      await updateService(service.id, {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        base_price: parseFloat(formData.get('price') as string) || 0,
        estimated_duration: minutes,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating service:', error)
      alert('Failed to update service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={service.name}
              placeholder="Interior Detail"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={service.description || ''}
              placeholder="Full interior cleaning and detailing..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service.price || ''}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label htmlFor="duration_minutes">Duration (hours)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                step="0.5"
                min="0"
                defaultValue={service.duration_minutes ? (service.duration_minutes / 60).toFixed(1) : ''}
                placeholder="2.0"
                inputMode="decimal"
              />
            </div>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

