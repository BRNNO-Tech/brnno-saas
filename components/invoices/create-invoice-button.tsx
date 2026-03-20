'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { addInvoice } from '@/lib/actions/invoices'
import { getClients } from '@/lib/actions/clients'
import { getServices } from '@/lib/actions/services'

type Client = { id: string; name: string }
type Service = { id: string; name: string; description: string | null; price: number | null }

type LineItem = {
  service_id: string | null
  name: string
  description?: string
  price: number
  quantity: number
}

export default function CreateInvoiceButton({ hasModule }: { hasModule: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, servicesData] = await Promise.all([
          getClients(),
          getServices(),
        ])
        setClients(clientsData)
        setServices(servicesData)
      } catch (error) {
        console.error('Error loading data:', error)
        alert('Failed to load clients or services')
      }
    }
    if (open) loadData()
  }, [open])

  function addFromService(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    setLineItems(prev => [...prev, {
      service_id: service.id,
      name: service.name,
      description: service.description || '',
      price: service.price || 0,
      quantity: 1,
    }])
  }

  function addCustomLine() {
    setLineItems(prev => [...prev, {
      service_id: null,
      name: '',
      price: 0,
      quantity: 1,
    }])
  }

  function updateItem(index: number, field: keyof LineItem, value: any) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function removeItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setSelectedClient('')
    setLineItems([])
    setNotes('')
    setDiscountCode('')
    setDiscountAmount('')
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = parseFloat(discountAmount) || 0
  const total = Math.max(0, subtotal - discount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient || lineItems.length === 0) {
      alert('Please select a client and add at least one item')
      return
    }
    const hasEmptyNames = lineItems.some(item => !item.name.trim())
    if (hasEmptyNames) {
      alert('Please fill in a name for all line items')
      return
    }

    setLoading(true)
    try {
      await addInvoice(
        selectedClient,
        lineItems.map(item => ({
          service_id: item.service_id ?? null,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
        })),
        {
          notes: notes || undefined,
          discount_code: discountCode || undefined,
          discount_amount: discount || undefined,
        }
      )
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating invoice:', error)
      const message = error instanceof Error ? error.message : 'Failed to create invoice'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dashboard-theme bg-[var(--dash-graphite)] border-[var(--dash-border)] text-[var(--dash-text)]">
        <DialogHeader>
          <DialogTitle className="font-dash-condensed font-bold text-[var(--dash-text)]">Create Invoice</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new invoice: choose a client, add line items, then submit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div>
            <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Client *</Label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
              required
            >
              <option value="">Select a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Add from services */}
          <div>
            <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Add Service</Label>
            <select
              onChange={e => {
                if (e.target.value) {
                  addFromService(e.target.value)
                  e.target.value = ''
                }
              }}
              className="mt-1 block w-full rounded-md border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 font-dash-mono text-[12px] text-[var(--dash-text)] focus:border-[var(--dash-amber)] focus:outline-none"
            >
              <option value="">Add from your services...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} — ${service.price?.toFixed(2) || '0.00'}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          {lineItems.length > 0 && (
            <div className="space-y-2">
              <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Line Items</Label>
              {lineItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Item name *"
                      value={item.name}
                      onChange={e => updateItem(index, 'name', e.target.value)}
                      className="flex-1 border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-surface)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={item.description || ''}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    className="border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="border-[var(--dash-border)] bg-[var(--dash-graphite)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                      />
                    </div>
                    <div className="w-28 text-right">
                      <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Subtotal</Label>
                      <p className="mt-2 font-dash-condensed font-bold text-[var(--dash-text)]">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Custom Line */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomLine}
            className="w-full border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] font-dash-mono text-[11px] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Line Item
          </Button>

          {/* Discount — module only */}
          {hasModule && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Discount Code (optional)</Label>
                <Input
                  placeholder="e.g. SUMMER20"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
              <div>
                <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Discount Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] focus-visible:border-[var(--dash-amber)]"
                />
              </div>
            </div>
          )}

          {/* Module upsell when discount not available */}
          {!hasModule && (
            <div className="rounded-lg border border-dashed border-[var(--dash-border)] bg-[var(--dash-surface)] p-3 text-center">
              <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                Discounts, templates, and automated reminders available with the{' '}
                <a href="/dashboard/settings/subscription" className="text-[var(--dash-amber)] hover:underline">
                  Invoices module
                </a>
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Notes to Client (optional)</Label>
            <Textarea
              placeholder="e.g. Thank you for your business! Payment via Zelle: 555-000-0000"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus-visible:border-[var(--dash-amber)]"
              rows={3}
            />
          </div>

          {/* Totals */}
          <div className="rounded-lg bg-[var(--dash-surface)] border border-[var(--dash-border)] p-4 space-y-1">
            <div className="flex justify-between font-dash-mono text-[12px] text-[var(--dash-text-muted)]">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-dash-mono text-[12px] text-[var(--dash-green)]">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-dash-condensed font-bold text-[var(--dash-text)] pt-1 border-t border-[var(--dash-border)]">
              <span>Total</span>
              <span className="text-[var(--dash-amber)]">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); resetForm() }}
              className="border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
