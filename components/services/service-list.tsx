'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, DollarSign, Trash2, Edit } from 'lucide-react'
import { deleteService } from '@/lib/actions/services'
import EditServiceDialog from './edit-service-dialog'
import { useState } from 'react'

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
  created_at: string
}

export default function ServiceList({ services }: { services: Service[] }) {
  const [editingService, setEditingService] = useState<Service | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await deleteService(id)
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Failed to delete service')
    }
  }

  if (services.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No services yet. Add your first service to get started.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingService(service)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          
          {service.description && (
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              {service.description}
            </p>
          )}
          
          <div className="space-y-2">
            {service.price !== null && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">${service.price.toFixed(2)}</span>
              </div>
            )}
            {service.duration_minutes !== null && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Clock className="h-4 w-4" />
                <span>
                  {service.duration_minutes % 60 === 0
                    ? `${service.duration_minutes / 60} ${service.duration_minutes / 60 === 1 ? 'hour' : 'hours'}`
                    : `${(service.duration_minutes / 60).toFixed(1)} hours`}
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
      </div>

      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
        />
      )}
    </>
  )
}

