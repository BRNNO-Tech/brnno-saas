'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Mail, Navigation, Play, Square, CheckCircle, Car, Navigation2, MapPin as MapPinIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JobPhotoUpload from './job-photo-upload'
import { formatJobDate } from '@/lib/utils/date-format'

type Assignment = {
  id: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  notes: string | null
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

type Worker = {
  id: string
  name: string
}

type Photo = {
  id: string
  photo_type: 'before' | 'after' | 'other'
  storage_url: string
  description: string | null
  uploaded_at: string
}

export default function WorkerJobDetail({
  assignment,
  worker,
  initialPhotos = []
}: {
  assignment: Assignment
  worker: Worker
  initialPhotos?: Photo[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(assignment.notes || '')

  const job = assignment.job
  const client = job.client

  const getJobAddress = () => {
    if (job.address) {
      return `${job.address}, ${job.city || ''} ${job.state || ''} ${job.zip || ''}`.replace(/,\s*$/, '').trim()
    }
    if (client.address) {
      return `${client.address}, ${client.city || ''} ${client.state || ''} ${client.zip || ''}`.replace(/,\s*$/, '').trim()
    }
    return null
  }

  const fullAddress = getJobAddress()
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  async function handleClockIn() {
    setLoading(true)
    try {
      const response = await fetch('/api/worker/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignment.id })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Clock in error:', error)
      alert('Failed to clock in')
    } finally {
      setLoading(false)
    }
  }

  async function handleClockOut() {
    setLoading(true)
    try {
      const response = await fetch('/api/worker/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignment.id })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Clock out error:', error)
      alert('Failed to clock out')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(status: 'on_my_way' | 'arrived' | 'in_progress') {
    setLoading(true)
    try {
      const response = await fetch('/api/worker/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          jobId: job.id,
          status
        })
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Status update error:', error)
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    console.log('handleComplete called')
    if (!confirm('Mark this job as complete?')) return

    console.log('Sending complete request...')
    setLoading(true)
    try {
      const response = await fetch('/api/worker/complete-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          assignmentId: assignment.id,
          notes
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        alert('Job marked as complete!')
        // Force a hard navigation to bypass cache
        window.location.href = '/worker'
      } else {
        alert(data.error || 'Failed to mark complete')
      }
    } catch (error) {
      console.error('Complete job error:', error)
      alert('Failed to mark complete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/worker"
            className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Job Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
              {job.service_type && (
                <p className="text-zinc-600 dark:text-zinc-400">{job.service_type}</p>
              )}
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Asset Details (Prominent) */}
          {job.asset_details && Object.keys(job.asset_details).length > 0 && (
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border flex gap-4 items-center">
              <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <Car className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 uppercase font-semibold">Asset Details</p>
                <p className="text-lg font-medium">
                  {Object.entries(job.asset_details)
                    .map(([key, value]) => `${value}`)
                    .join(' • ')}
                </p>
              </div>
            </div>
          )}

          {job.description && (
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Instructions</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{job.description}</p>
            </div>
          )}

          <div className="grid gap-3 pt-4 border-t">
            {job.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-zinc-400" />
                <span className="font-medium">
                  {formatJobDate(job.scheduled_date)}
                </span>
              </div>
            )}

            {/* Address */}
            {fullAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <span className="font-medium block">{fullAddress}</span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Navigation className="h-3 w-3" /> Get Directions
                    </a>
                  )}
                </div>
              </div>
            )}

            {job.estimated_duration && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Clock className="h-5 w-5" />
                <span>
                  Estimated duration: ~
                  {job.estimated_duration % 60 === 0
                    ? `${job.estimated_duration / 60} ${job.estimated_duration / 60 === 1 ? 'hour' : 'hours'}`
                    : `${(job.estimated_duration / 60).toFixed(1)} hours`}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        {client && (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-lg">{client.name}</p>
              </div>

              <div className="grid gap-3">
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Call Customer</p>
                      <p className="text-zinc-600 dark:text-zinc-400">{client.phone}</p>
                    </div>
                  </a>
                )}

                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email Customer</p>
                      <p className="text-zinc-600 dark:text-zinc-400">{client.email}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Photo Upload */}
        <JobPhotoUpload
          assignmentId={assignment.id}
          jobId={job.id}
          initialPhotos={initialPhotos}
          readOnly={job.status === 'completed'}
        />

        {/* Action Buttons */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Job Actions</h2>

          <div className="space-y-4">
            {/* Status Updates */}
            {!assignment.clocked_in_at && job.status !== 'completed' && (
              <div className="space-y-2">
                <Button
                  onClick={() => handleStatusUpdate('on_my_way')}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-12 text-lg gap-2"
                >
                  <Navigation2 className="h-5 w-5" />
                  On My Way
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('arrived')}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-12 text-lg gap-2"
                >
                  <MapPinIcon className="h-5 w-5" />
                  Arrived at Location
                </Button>
                <Button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full h-12 text-lg gap-2"
                >
                  <Play className="h-5 w-5" />
                  Start Job (Clock In)
                </Button>
              </div>
            )}

            {assignment.clocked_in_at && !assignment.clocked_out_at && (
              <div className="space-y-2">
                <Button
                  onClick={handleClockOut}
                  disabled={loading}
                  variant="destructive"
                  className="w-full h-12 text-lg gap-2"
                >
                  <Square className="h-5 w-5 fill-current" />
                  End Job (Clock Out)
                </Button>
              </div>
            )}

            {job.status !== 'completed' && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about the job..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleComplete()
                  }}
                  disabled={loading}
                  className="w-full h-12 text-lg gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  Mark as Complete
                </Button>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Job Completed
                </p>
                {assignment.clocked_in_at && (
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Clocked in: {new Date(assignment.clocked_in_at).toLocaleTimeString()}
                  </p>
                )}
                {assignment.clocked_out_at && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Clocked out: {new Date(assignment.clocked_out_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
