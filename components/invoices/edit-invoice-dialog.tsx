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
import { updateInvoice } from '@/lib/actions/invoices'
import { getClients } from '@/lib/actions/clients'

type Client = { id: string; name: string }

type Invoice = {
  id: string
  client_id: string | null
}

export default function EditInvoiceDialog({ 
  invoice, 
  open, 
  onOpenChange 
}: { 
  invoice: Invoice
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const clientId = formData.get('client_id') as string
    
    try {
      await updateInvoice(invoice.id, clientId)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client_id">Client</Label>
            <select
              id="client_id"
              name="client_id"
              defaultValue={invoice.client_id || ''}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
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

