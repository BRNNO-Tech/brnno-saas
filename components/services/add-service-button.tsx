'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createService } from '@/lib/actions/services'
import { Plus } from 'lucide-react'

export default function AddServiceButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const hoursInput = formData.get('duration_minutes') as string
      const hours = hoursInput ? parseFloat(hoursInput) : undefined
      // Convert hours to minutes for storage, but only if valid (> 0)
      const minutes = hours !== undefined && hours > 0 ? Math.round(hours * 60) : undefined
      
      const priceInput = formData.get('price') as string
      const price = priceInput ? parseFloat(priceInput) : 0
      
      if (!price || price <= 0) {
        alert('Please enter a valid price')
        return
      }
      
      // Ensure duration is provided for new services (default to 1 hour if not specified)
      const finalDuration = minutes || 60
      
      await createService({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        base_price: price,
        estimated_duration: finalDuration,
      })
      formRef.current?.reset()
      setOpen(false)
    } catch (error: any) {
      console.error('Error creating service:', error)
      const errorMessage = error?.message || error?.code || 'Failed to create service. Please check the console for details.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) formRef.current?.reset()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Interior Detail"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
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
                placeholder="2.0"
                inputMode="decimal"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                formRef.current?.reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

