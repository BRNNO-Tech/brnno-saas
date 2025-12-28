'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateJob } from '@/lib/actions/jobs'
import { getClients } from '@/lib/actions/clients'

type Client = { id: string; name: string }

type Job = {
  id: string
  title: string
  description: string | null
  service_type: string | null
  scheduled_date: string | null
  estimated_duration: number | null
  estimated_cost: number | null
  priority: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  is_mobile_service: boolean
  client_notes: string | null
  internal_notes: string | null
  client_id: string | null
}

export default function EditJobSheet({ 
  job, 
  open, 
  onOpenChange 
}: { 
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    async function loadClients() {
      try {
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    if (open) loadClients()
  }, [open])

  // Format datetime for input
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateJob(job.id, formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Job</SheetTitle>
          <SheetDescription>
            Make changes to the job details.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={job.client_id || ''}
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
                defaultValue={job.title}
                placeholder="Full Detail - Honda Civic"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={job.description || ''}
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
                  defaultValue={job.service_type || ''}
                  placeholder="Detail"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={job.priority}
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
                  defaultValue={formatDateTime(job.scheduled_date)}
                />
              </div>
              <div>
                <Label htmlFor="estimated_duration">Duration (mins)</Label>
                <Input
                  id="estimated_duration"
                  name="estimated_duration"
                  type="number"
                  defaultValue={job.estimated_duration || ''}
                  placeholder="120"
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
                defaultValue={job.estimated_cost || ''}
                placeholder="150.00"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                id="is_mobile_service"
                name="is_mobile_service"
                type="checkbox"
                value="true"
                defaultChecked={job.is_mobile_service}
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
                  defaultValue={job.address || ''}
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
                    defaultValue={job.city || ''}
                    placeholder="City"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={job.state || ''}
                    placeholder="State"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    name="zip"
                    defaultValue={job.zip || ''}
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
                defaultValue={job.client_notes || ''}
                placeholder="Customer requests..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                name="internal_notes"
                defaultValue={job.internal_notes || ''}
                placeholder="Private notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
      </SheetContent>
    </Sheet>
  )
}
