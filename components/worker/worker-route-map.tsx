'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Calendar, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatJobDate } from '@/lib/utils/date-format'

type Job = {
  id: string
  title: string
  scheduled_date: string | null
  status: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  client: {
    name: string
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
  } | null
}

export default function WorkerRouteMap({ jobs }: { jobs: Job[] }) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  function getJobAddress(job: Job): string | null {
    if (job.address && job.city) {
      return `${job.address}, ${job.city}, ${job.state || ''} ${job.zip || ''}`.trim()
    }
    if (job.client?.address && job.client?.city) {
      return `${job.client.address}, ${job.client.city}, ${job.client.state || ''} ${job.client.zip || ''}`.trim()
    }
    return null
  }

  function getGoogleMapsUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  function getDirectionsUrl(addresses: string[]): string {
    if (addresses.length === 0) return ''
    if (addresses.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addresses[0])}`
    }
    // Multiple waypoints
    const waypoints = addresses.slice(0, -1).map(addr => encodeURIComponent(addr)).join('&waypoints=')
    const destination = encodeURIComponent(addresses[addresses.length - 1])
    return `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination}`
  }

  function handleOptimizeRoute() {
    const addresses = jobs
      .map(job => getJobAddress(job))
      .filter((addr): addr is string => addr !== null)

    if (addresses.length === 0) {
      alert('No jobs with addresses found')
      return
    }

    // Sort by scheduled time if available
    const sortedJobs = [...jobs].sort((a, b) => {
      if (!a.scheduled_date) return 1
      if (!b.scheduled_date) return -1
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    })

    const sortedAddresses = sortedJobs
      .map(job => getJobAddress(job))
      .filter((addr): addr is string => addr !== null)

    const directionsUrl = getDirectionsUrl(sortedAddresses)
    if (directionsUrl) {
      window.open(directionsUrl, '_blank')
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-lg font-semibold mb-2">No jobs with addresses</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Jobs need addresses to appear on the map
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} with addresses
          </p>
        </div>
        <Button onClick={handleOptimizeRoute} className="w-full sm:w-auto">
          <Navigation className="h-4 w-4 mr-2" />
          Get Optimized Route
        </Button>
      </div>

      {/* Jobs List */}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map(job => {
          const address = getJobAddress(job)
          const mapsUrl = address ? getGoogleMapsUrl(address) : null
          const isSelected = selectedJob?.id === job.id

          return (
            <Card
              key={job.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.scheduled_date && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatJobDate(job.scheduled_date)}
                    </span>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300">{address}</span>
                  </div>
                )}

                {job.client && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">Client:</span> {job.client.name}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Navigation className="h-3 w-3 mr-1" />
                        Directions
                      </Button>
                    </a>
                  )}
                  <Link
                    href={`/worker/jobs/${job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Route Optimization Tips</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Click "Get Optimized Route" to open Google Maps with all job locations</li>
                <li>Jobs are sorted by scheduled time for optimal routing</li>
                <li>Use the Directions button on each job card for individual navigation</li>
                <li>Make sure location services are enabled for best results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

