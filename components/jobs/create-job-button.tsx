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
import { getClients, addClient } from '@/lib/actions/clients'
import { getServices } from '@/lib/actions/services'
import { toast } from 'sonner'
import { useOpenNewJob } from '@/lib/contexts/open-new-job-context'

type Client = { id: string; name: string }
type Service = { id: string; name: string; price?: number; base_duration?: number; duration_minutes?: number; estimated_duration?: number }

type CreateJobButtonProps = {
  /** Optional custom trigger (e.g. header-style button); must forward ref and handle click for Sheet */
  trigger?: React.ReactNode
}

export default function CreateJobButton({ trigger }: CreateJobButtonProps) {
  const { openWithClientId, setOpenWithClientId } = useOpenNewJob()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (openWithClientId) setOpen(true)
  }, [openWithClientId])

  useEffect(() => {
    if (open) setSelectedClientId(openWithClientId ?? '')
  }, [open, openWithClientId])

  useEffect(() => {
    async function load() {
      try {
        const [clientsData, servicesData] = await Promise.all([getClients(), getServices()])
        setClients(clientsData)
        setServices(servicesData as Service[])
      } catch (error) {
        toast.error('Failed to load clients or services')
      }
    }
    if (open) load()
  }, [open])

  function resetClientState() {
    setSelectedClientId('')
    setSelectedServiceId('')
    setIsCreatingNewClient(false)
    setNewClientName('')
    setNewClientPhone('')
    setNewClientEmail('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    if (isCreatingNewClient) {
      const name = newClientName.trim()
      if (!name) {
        toast.error('Please enter the new client name.')
        setLoading(false)
        return
      }
      try {
        const clientFormData = new FormData()
        clientFormData.set('name', name)
        clientFormData.set('phone', newClientPhone.trim() || '')
        clientFormData.set('email', newClientEmail.trim() || '')
        // Save address to new client when provided on the job form
        const address = formData.get('address') as string
        const city = formData.get('city') as string
        const state = formData.get('state') as string
        const zip = formData.get('zip') as string
        if (address?.trim()) clientFormData.set('address', address.trim())
        if (city?.trim()) clientFormData.set('city', city.trim())
        if (state?.trim()) clientFormData.set('state', state.trim())
        if (zip?.trim()) clientFormData.set('zip', zip.trim())
        const newClientId = await addClient(clientFormData)
        formData.set('client_id', newClientId)
      } catch (err) {
        toast.error('Failed to create client. Please try again.')
        setLoading(false)
        return
      }
    } else if (selectedClientId) {
      formData.set('client_id', selectedClientId)
    }

    // Set title and service_type from selected service; prefill duration/cost if available
    const serviceId = formData.get('service_id') as string
    if (serviceId) {
      const service = services.find((s) => s.id === serviceId)
      if (service) {
        formData.set('title', service.name)
        formData.set('service_type', service.name)
        const durationMin = service.base_duration ?? service.duration_minutes ?? service.estimated_duration
        if (durationMin != null) formData.set('estimated_duration', String(durationMin / 60))
        if (service.price != null) formData.set('estimated_cost', String(service.price))
      }
    }

    // Build asset_details from vehicle fields for job card
    const make = (formData.get('vehicle_make') as string)?.trim()
    const model = (formData.get('vehicle_model') as string)?.trim()
    const year = (formData.get('vehicle_year') as string)?.trim()
    const color = (formData.get('vehicle_color') as string)?.trim()
    const licensePlate = (formData.get('vehicle_license_plate') as string)?.trim()
    if (make || model || year || color || licensePlate) {
      const assetDetails: Record<string, string> = {}
      if (year) assetDetails.year = year
      if (make) assetDetails.make = make
      if (model) assetDetails.model = model
      if (color) assetDetails.color = color
      if (licensePlate) assetDetails.licensePlate = licensePlate
      formData.set('asset_details', JSON.stringify(assetDetails))
    }

    // Convert datetime-local to UTC ISO string on the client side
    const scheduledDateInput = formData.get('scheduled_date') as string | null
    if (scheduledDateInput) {
      const localDate = new Date(scheduledDateInput)
      formData.set('scheduled_date', localDate.toISOString())
    }

    try {
      await addJob(formData)
      formRef.current?.reset()
      setOpen(false)
      setOpenWithClientId(null)
      resetClientState()
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
      if (!isOpen) {
        setOpenWithClientId(null)
        formRef.current?.reset()
        resetClientState()
      }
    }}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button className="rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Job
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full dashboard-theme bg-[var(--dash-graphite)] border-l border-[var(--dash-border)] text-[var(--dash-text)] [&>button]:text-[var(--dash-text-muted)] [&>button]:hover:text-[var(--dash-text)] [&>button]:right-4 [&>button]:top-4">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">Schedule New Job</SheetTitle>
          <SheetDescription className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Create a new job and assign it to a client.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 px-6 pb-[max(5rem,env(safe-area-inset-bottom))]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_id" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Client</Label>
              {!isCreatingNewClient && (
                <select
                  id="client_id"
                  name="client_id"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
                >
                  <option value="">Select a client (optional)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="create_new_client"
                  type="checkbox"
                  checked={isCreatingNewClient}
                  onChange={(e) => setIsCreatingNewClient(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--dash-border-bright)] bg-[var(--dash-surface)] text-[var(--dash-amber)] focus:ring-[var(--dash-amber)]"
                />
                <Label htmlFor="create_new_client" className="!mt-0 cursor-pointer font-dash-mono text-[11px] text-[var(--dash-text-muted)] flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create new client instead
                </Label>
              </div>
              {isCreatingNewClient && (
                <div className="mt-3 space-y-3 rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)]/50 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="new_client_name" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Client Name *</Label>
                    <Input
                      id="new_client_name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Client name"
                      className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_client_phone" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Phone (optional)</Label>
                    <Input
                      id="new_client_phone"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="Phone"
                      className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_client_email" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Email (optional)</Label>
                    <Input
                      id="new_client_email"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Email"
                      className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="service_id" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Service *</Label>
              <select
                id="service_id"
                name="service_id"
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
              >
                <option value="">Select a service</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>{svc.name}</option>
                ))}
              </select>
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

            <div className="space-y-4 rounded-lg border border-[var(--dash-border)] p-4 bg-[var(--dash-surface)]/50">
              <h4 className="font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)]">Vehicle</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_year" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Year</Label>
                  <Input
                    id="vehicle_year"
                    name="vehicle_year"
                    placeholder="2024"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_make" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Make</Label>
                  <Input
                    id="vehicle_make"
                    name="vehicle_make"
                    placeholder="Honda"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_model" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Model</Label>
                  <Input
                    id="vehicle_model"
                    name="vehicle_model"
                    placeholder="Civic"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_color" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Color</Label>
                  <Input
                    id="vehicle_color"
                    name="vehicle_color"
                    placeholder="Silver"
                    className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vehicle_license_plate" className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">License plate (optional)</Label>
                <Input
                  id="vehicle_license_plate"
                  name="vehicle_license_plate"
                  placeholder="ABC-1234"
                  className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)] focus-visible:ring-[var(--dash-amber)] font-dash-mono text-[12px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
