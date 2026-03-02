'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { updateInvoice } from '@/lib/actions/invoices'
import { getClients } from '@/lib/actions/clients'
import { getServices } from '@/lib/actions/services'

type Client = { id: string; name: string }
type Service = { id: string; name: string; price: number | null }

type LineItem = {
  service_id?: string | null
  name: string
  description?: string
  price: number
  quantity: number
}

type Invoice = {
  id: string
  client_id: string | null
  notes?: string | null
  discount_code?: string | null
  discount_amount?: number | null
  invoice_items: Array<{
    service_id?: string | null
    name: string
    description?: string | null
    price: number
    quantity: number
  }>
}

export default function EditInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState(invoice.client_id || '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice.invoice_items?.map(item => ({
      service_id: item.service_id || null,
      name: item.name,
      description: item.description || '',
      price: item.price,
      quantity: item.quantity,
    })) || []
  )
  const [notes, setNotes] = useState(invoice.notes || '')
  const [discountCode, setDiscountCode] = useState(invoice.discount_code || '')
  const [discountAmount, setDiscountAmount] = useState(invoice.discount_amount?.toString() || '')

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
      }
    }
    if (open) loadData()
  }, [open])

  // Reset form when invoice changes
  useEffect(() => {
    setSelectedClient(invoice.client_id || '')
    setLineItems(
      invoice.invoice_items?.map(item => ({
        service_id: item.service_id || null,
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
      })) || []
    )
    setNotes(invoice.notes || '')
    setDiscountCode(invoice.discount_code || '')
    setDiscountAmount(invoice.discount_amount?.toString() || '')
  }, [invoice])

  function addFromService(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    setLineItems(prev => [...prev, {
      service_id: service.id,
      name: service.name,
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

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = parseFloat(discountAmount) || 0
  const total = Math.max(0, subtotal - discount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) {
      alert('Please select a client')
      return
    }
    if (lineItems.length === 0) {
      alert('Please add at least one service or item')
      return
    }
    // Validate custom line items have names
    const hasEmptyNames = lineItems.some(item => !item.name.trim())
    if (hasEmptyNames) {
      alert('Please fill in a name for all line items')
      return
    }

    setLoading(true)
    try {
      await updateInvoice(invoice.id, {
        client_id: selectedClient,
        items: lineItems,
        notes: notes || undefined,
        discount_code: discountCode || undefined,
        discount_amount: discount || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div>
            <Label>Client *</Label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
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
            <Label>Add Service</Label>
            <select
              onChange={e => {
                if (e.target.value) {
                  addFromService(e.target.value)
                  e.target.value = ''
                }
              }}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
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
              <Label>Line Items</Label>
              {lineItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Item name *"
                      value={item.name}
                      onChange={e => updateItem(index, 'name', e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={item.description || ''}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-zinc-500">Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs text-zinc-500">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-28 text-right">
                      <Label className="text-xs text-zinc-500">Subtotal</Label>
                      <p className="mt-2 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
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
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Line Item
          </Button>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Discount Code (optional)</Label>
              <Input
                placeholder="e.g. SUMMER20"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Discount Amount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes to Client (optional)</Label>
            <Textarea
              placeholder="e.g. Thank you for your business! Payment via Zelle: 555-000-0000"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Totals */}
          <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 space-y-1">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-zinc-200 dark:border-zinc-700">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
