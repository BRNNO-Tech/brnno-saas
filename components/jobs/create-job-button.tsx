'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { addJob } from '@/lib/actions/jobs'
import { getClients } from '@/lib/actions/clients'
import { toast } from 'sonner'

type Client = { id: string; name: string }

export default function CreateJobButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    async function loadClients() {
      try {
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        toast.error('Failed to load clients')
      }
    }
    if (open) loadClients()
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await addJob(formData)
      formRef.current?.reset()
      setOpen(false)
      toast.success('Job created successfully')
    } catch (error) {
      toast.error('Failed to create job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) formRef.current?.reset()
    }}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>Schedule New Job</SheetTitle>
          <SheetDescription>
            Create a new job and assign it to a client.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 px-6 pb-20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                name="client_id"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="">Select a client (optional)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Full Detail - Honda Civic"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Interior and exterior detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type</Label>
                <Input
                  id="service_type"
                  name="service_type"
                  placeholder="Detail"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="medium"
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Scheduled Date/Time</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="datetime-local"
                />
              </div>
              <div>
                <Label htmlFor="estimated_duration">Duration (hours)</Label>
                <Input
                  id="estimated_duration"
                  name="estimated_duration"
                  type="number"
                  step="0.5"
                  placeholder="2.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                name="estimated_cost"
                type="number"
                step="0.01"
                placeholder="150.00"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                id="is_mobile_service"
                name="is_mobile_service"
                type="checkbox"
                value="true"
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="is_mobile_service" className="!mt-0 cursor-pointer">Mobile Service</Label>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-sm text-zinc-500">Location</h4>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="UT"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    name="zip"
                    placeholder="ZIP"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="client_notes">Client Notes</Label>
              <Textarea
                id="client_notes"
                name="client_notes"
                placeholder="Customer requests..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                name="internal_notes"
                placeholder="Private notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
