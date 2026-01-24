'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Trash2, Edit, Eye } from 'lucide-react'
import { deleteClient } from '@/lib/actions/clients'
import EditClientDialog from './edit-client-dialog'
import { useState } from 'react'
import Link from 'next/link'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export default function ClientList({ clients }: { clients: Client[] }) {
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      await deleteClient(id)
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  if (clients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No clients yet. Add your first client to get started.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{client.name}</h3>
              </div>
              <div className="flex gap-1">
                <Link href={`/dashboard/clients/${client.id}`}>
                  <Button variant="ghost" size="icon" title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingClient(client)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(client.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.notes && (
                <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                  {client.notes}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}
    </>
  )
}

