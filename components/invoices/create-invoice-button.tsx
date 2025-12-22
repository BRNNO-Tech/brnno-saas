'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { addInvoice } from '@/lib/actions/invoices'
import { getClients } from '@/lib/actions/clients'
import { getServices } from '@/lib/actions/services'

type Client = { id: string; name: string }
type Service = { id: string; name: string; description: string | null; price: number | null }

export default function CreateInvoiceButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedServices, setSelectedServices] = useState<Array<{ service_id: string; name: string; description?: string; price: number; quantity: number }>>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, servicesData] = await Promise.all([
          getClients(),
          getServices()
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

  function addService(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    
    setSelectedServices([...selectedServices, {
      service_id: service.id,
      name: service.name,
      description: service.description || undefined,
      price: service.price || 0,
      quantity: 1
    }])
  }

  function removeService(index: number) {
    setSelectedServices(selectedServices.filter((_, i) => i !== index))
  }

  function updateQuantity(index: number, quantity: number) {
    const updated = [...selectedServices]
    updated[index].quantity = quantity
    setSelectedServices(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient || selectedServices.length === 0) {
      alert('Please select a client and at least one service')
      return
    }
    
    setLoading(true)
    
    try {
      await addInvoice(selectedClient, selectedServices)
      setOpen(false)
      setSelectedClient('')
      setSelectedServices([])
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const total = selectedServices.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setSelectedClient('')
        setSelectedServices([])
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Client */}
          <div>
            <Label>Select Client *</Label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              required
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Add Services */}
          <div>
            <Label>Add Services</Label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addService(e.target.value)
                  e.target.value = ''
                }
              }}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="">Add a service...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price?.toFixed(2) || '0.00'}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Services */}
          {selectedServices.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Services</Label>
              {selectedServices.map((item, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSelectedClient('')
                setSelectedServices([])
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

