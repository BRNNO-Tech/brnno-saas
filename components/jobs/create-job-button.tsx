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

type CreateJobButtonProps = {
  /** Optional custom trigger (e.g. header-style button); must forward ref and handle click for Sheet */
  trigger?: React.ReactNode
}

export default function CreateJobButton({ trigger }: CreateJobButtonProps) {
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
    
    // Convert datetime-local to UTC ISO string on the client side
    // This ensures the timezone conversion happens in the user's browser, not on the server
    const scheduledDateInput = formData.get('scheduled_date') as string | null
    if (scheduledDateInput) {
      // datetime-local gives us local time in the user's timezone
      // Create a Date object from it (this will be in the user's local timezone)
      const localDate = new Date(scheduledDateInput)
      // Convert to ISO string (UTC) for storage
      formData.set('scheduled_date', localDate.toISOString())
    }
    
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
        {trigger ?? (
          <button className="rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Job
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-xl w-full dashboard-theme bg-[var(--dash-graphite)] border-l border-[var(--dash-border)] text-[var(--dash-text)] [&>button]:text-[var(--dash-text-muted)] [&>button]:hover:text-[var(--dash-text)] [&>button]:right-4 [&>button]:top-4">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">Schedule New Job</SheetTitle>
          <SheetDescription className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Create a new job and assign it to a client.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 px-6 pb-20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_id" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Client</Label>
              <select
                id="client_id"
                name="client_id"
                className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
              >
                <option value="">Select a client (optional)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Job Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Full Detail - Honda Civic"
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
              />
            </div>

            <div>
              <Label htmlFor="description" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Interior and exterior detail..."
                rows={3}
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Service Type</Label>
                <Input
                  id="service_type"
                  name="service_type"
                  placeholder="Detail"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label htmlFor="priority" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="medium"
                  className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
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
                <Label htmlFor="scheduled_date" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Scheduled Date/Time</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="datetime-local"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label htmlFor="estimated_duration" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Duration (hours)</Label>
                <Input
                  id="estimated_duration"
                  name="estimated_duration"
                  type="number"
                  step="0.5"
                  placeholder="2.0"
                  className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_cost" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                name="estimated_cost"
                type="number"
                step="0.01"
                placeholder="150.00"
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                id="is_mobile_service"
                name="is_mobile_service"
                type="checkbox"
                value="true"
                className="h-4 w-4 rounded border-[var(--dash-border-bright)] bg-[var(--dash-surface)] text-[var(--dash-amber)] focus:ring-[var(--dash-amber)]"
              />
              <Label htmlFor="is_mobile_service" className="!mt-0 cursor-pointer font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Mobile Service</Label>
            </div>

            <div className="space-y-4 rounded-lg border border-[var(--dash-border)] p-4 bg-[var(--dash-surface)]/50">
              <h4 className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">Location</h4>
              <div>
                <Label htmlFor="address" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St"
                  className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">State</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="UT"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                  />
                </div>
                <div>
                  <Label htmlFor="zip" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">ZIP</Label>
                  <Input
                    id="zip"
                    name="zip"
                    placeholder="ZIP"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="client_notes" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Client Notes</Label>
              <Textarea
                id="client_notes"
                name="client_notes"
                placeholder="Customer requests..."
                rows={2}
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
              />
            </div>

            <div>
              <Label htmlFor="internal_notes" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                name="internal_notes"
                placeholder="Private notes..."
                rows={2}
                className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--dash-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                formRef.current?.reset()
              }}
              className="border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
