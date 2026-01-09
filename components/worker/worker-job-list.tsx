'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Phone, Mail, Navigation } from 'lucide-react'
import Link from 'next/link'

type Assignment = {
  id: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  job: {
    id: string
    title: string
    description: string | null
    service_type: string | null
    scheduled_date: string | null
    estimated_duration: number | null
    estimated_cost: number | null
    status: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    asset_details: Record<string, any> | null
    client: {
      name: string
      phone: string | null
      email: string | null
      address: string | null
      city: string | null
      state: string | null
      zip: string | null
    }
  }
}

export default function WorkerJobList({ assignments }: { assignments: Assignment[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  function getJobAddress(job: Assignment['job']) {
    // Prefer job specific address, fallback to client address
    if (job.address) {
      return `${job.address}, ${job.city || ''} ${job.state || ''} ${job.zip || ''}`.replace(/,\s*$/, '').trim()
    }
    const client = job.client
    if (client && client.address) {
      return `${client.address}, ${client.city || ''} ${client.state || ''} ${client.zip || ''}`.replace(/,\s*$/, '').trim()
    }
    return null
  }

  function getGoogleMapsUrl(address: string | null) {
    if (!address) return null
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const job = assignment.job
        const client = job.client || null
        const fullAddress = getJobAddress(job)
        const mapsUrl = getGoogleMapsUrl(fullAddress)

        return (
          <Card key={assignment.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Link href={`/worker/jobs/${job.id}`}>
                  <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                </Link>
                {job.service_type && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {job.service_type}
                  </p>
                )}
                 {job.asset_details && Object.keys(job.asset_details).length > 0 && (
                   <p className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wide">
                     {Object.entries(job.asset_details)
                       .map(([key, value]) => `${value}`)
                       .join(' • ')}
                   </p>
                )}
              </div>
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Job Details */}
            <div className="space-y-3 mb-4">
              {job.scheduled_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>
                    {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {fullAddress && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>

            {/* Customer Info (Simplified for List) */}
            {client && (
              <div className="border-t pt-4 mb-4">
                 <div className="flex justify-between items-center">
                   <p className="text-sm font-medium">{client.name}</p>
                   <div className="flex gap-2">
                     {client.phone && (
                        <a href={`tel:${client.phone}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </a>
                     )}
                     {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20">
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </a>
                     )}
                   </div>
                 </div>
              </div>
            )}

            {/* Actions */}
            <Link href={`/worker/jobs/${job.id}`}>
              <Button variant="outline" className="w-full">
                View Full Details
              </Button>
            </Link>
          </Card>
        )
      })}
    </div>
  )
}
