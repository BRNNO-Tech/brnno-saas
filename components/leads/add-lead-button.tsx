'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Plus } from 'lucide-react'
import { createLead } from '@/lib/actions/leads'
import { getServices } from '@/lib/actions/services'
import { toast } from 'sonner'

export default function AddLeadButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    async function loadServices() {
      try {
        const servicesData = await getServices()
        setServices(servicesData)
      } catch (error) {
        toast.error('Failed to load services')
      }
    }
    if (open) loadServices()
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await createLead(formData)
      formRef.current?.reset()
      setOpen(false)
      toast.success('Lead created successfully')
    } catch (error) {
      console.error('Error creating lead:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create lead. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="source">How did they find you?</Label>
            <select
              id="source"
              name="source"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">Select source...</option>
              <option value="phone">Phone call</option>
              <option value="text">Text message</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google search</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="interested_in_service_id">Interested in</Label>
            <select
              id="interested_in_service_id"
              name="interested_in_service_id"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">Select service (optional)...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - $
                  {service.price != null
                    ? Number(service.price).toFixed(2)
                    : '0.00'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

