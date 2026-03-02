'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trash2,
  Play,
  CheckCircle,
  Edit,
  MapPin,
  Car,
  DollarSign,
  Clock,
  User,
  Calendar,
  Navigation
} from 'lucide-react'
import { deleteJob, updateJobStatus } from '@/lib/actions/jobs'
import EditJobSheet from './edit-job-dialog'
import AssignJobDialog from './assign-job-dialog'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatJobDate } from '@/lib/utils/date-format'
import { MileageDisplay } from '@/components/mileage/mileage-display'
import { PhotoCountBadge } from '@/components/jobs/photo-count-badge'

type Job = {
  id: string
  title: string
  description: string | null
  service_type: string | null
  scheduled_date: string | null
  estimated_cost: number | null
  estimated_duration: number | null
  status: string
  priority: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  is_mobile_service: boolean
  client_notes: string | null
  internal_notes: string | null
  client_id: string | null
  client: { name: string; phone?: string } | null
  assignments?: {
    id: string
    team_member: {
      id: string
      name: string
      role: string
    }
  }[]
  asset_details?: Record<string, any> | null
  mileage_record?: {
    id: string
    miles_driven: number
    is_manual_override: boolean
    from_address: string | null
    from_city: string | null
    from_state: string | null
    from_zip: string | null
  } | null
  photo_count?: number
  addons?: Array<{ id?: string; name: string; price?: number }> | null
  vehicle_condition?: string | null
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-500',
        textColor: 'text-green-700 dark:text-green-300'
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700 dark:text-blue-300'
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-500',
        textColor: 'text-red-700 dark:text-red-300'
      }
    default:
      return {
        label: 'Scheduled',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700 dark:text-yellow-300'
      }
  }
}

function getLocalDateAtMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Group upcoming jobs by date label; sort by actual date
function groupByDate(jobs: Job[]): { label: string; jobs: Job[]; sortKey: number }[] {
  const groups: Record<string, Job[]> = {}
  const now = new Date()
  const today = getLocalDateAtMidnight(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  jobs.forEach(job => {
    if (!job.scheduled_date) {
      const key = 'No Date'
      groups[key] = groups[key] || []
      groups[key].push(job)
      return
    }
    const jobDate = getLocalDateAtMidnight(new Date(job.scheduled_date))
    let label: string
    if (jobDate.getTime() === today.getTime()) {
      label = 'Today'
    } else if (jobDate.getTime() === tomorrow.getTime()) {
      label = 'Tomorrow'
    } else {
      label = jobDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }
    groups[label] = groups[label] || []
    groups[label].push(job)
  })

  return Object.entries(groups)
    .map(([label, groupJobs]) => {
      const sortKey = label === 'No Date' ? Infinity : (groupJobs[0]?.scheduled_date ? new Date(groupJobs[0].scheduled_date).getTime() : Infinity)
      return { label, jobs: groupJobs, sortKey }
    })
    .sort((a, b) => {
      if (a.label === 'No Date') return 1
      if (b.label === 'No Date') return -1
      return a.sortKey - b.sortKey
    })
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await deleteJob(id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    }
  }

  async function handleStatusChange(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      await updateJobStatus(id, status)
      if (status === 'in_progress') {
        toast.success('Job started', { description: 'The job has been marked as in progress' })
      } else if (status === 'completed') {
        toast.success('Job completed', { description: 'Mileage tracking in progress...' })
      } else {
        toast.success('Job status updated', { description: `Status changed to ${status.replace('_', ' ')}` })
      }
      router.refresh()
    } catch (error: any) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job', { description: error?.message || 'Failed to update job' })
    }
  }

  const uniqueJobs = jobs.filter((job, index, self) => {
    const firstIndex = self.findIndex((j) => j.id === job.id)
    if (firstIndex !== index) {
      console.warn(`Duplicate job detected: ${job.id} at index ${index}, keeping first occurrence at ${firstIndex}`)
    }
    return firstIndex === index
  })

  if (uniqueJobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Car className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">No jobs found</p>
      </Card>
    )
  }

  const now = new Date()
  const today = getLocalDateAtMidnight(now)

  const todayJobs = uniqueJobs.filter(j => {
    if (!j.scheduled_date) return false
    return getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() === today.getTime()
  })

  const upcomingJobs = uniqueJobs.filter(j => {
    if (!j.scheduled_date) return false
    return getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() > today.getTime()
  })

  const pastJobs = uniqueJobs.filter(j => {
    if (!j.scheduled_date) return true
    return getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() < today.getTime()
  })

  const upcomingGroups = groupByDate(upcomingJobs)

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 text-center">
      <Car className="h-10 w-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  )

  return (
    <>
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
          <TabsTrigger value="today" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 relative">
            Today
            {todayJobs.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 text-white text-xs px-1.5 py-0.5 leading-none">
                {todayJobs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
            Upcoming
            {upcomingJobs.length > 0 && (
              <span className="ml-2 rounded-full bg-zinc-400 dark:bg-zinc-600 text-white text-xs px-1.5 py-0.5 leading-none">
                {upcomingJobs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
            Past
            {pastJobs.length > 0 && (
              <span className="ml-2 rounded-full bg-zinc-400 dark:bg-zinc-600 text-white text-xs px-1.5 py-0.5 leading-none">
                {pastJobs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TODAY */}
        <TabsContent value="today" className="space-y-3">
          {todayJobs.length === 0 ? (
            <EmptyState message="No jobs scheduled for today" />
          ) : (
            todayJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={setEditingJob}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </TabsContent>

        {/* UPCOMING - grouped by date */}
        <TabsContent value="upcoming" className="space-y-6">
          {upcomingJobs.length === 0 ? (
            <EmptyState message="No upcoming jobs" />
          ) : (
            upcomingGroups.map(({ label, jobs: groupJobs }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  {label}
                </p>
                <div className="space-y-3">
                  {groupJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onEdit={setEditingJob}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* PAST */}
        <TabsContent value="past" className="space-y-3">
          {pastJobs.length === 0 ? (
            <EmptyState message="No past jobs" />
          ) : (
            pastJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={setEditingJob}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {editingJob && (
        <EditJobSheet
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
        />
      )}
    </>
  )
}

function JobCard({
  job,
  onEdit,
  onDelete,
  onStatusChange
}: {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: any) => void
}) {
  const statusConfig = getStatusConfig(job.status)

  return (
    <Card className={`p-4 transition-all hover:shadow-md border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/dashboard/jobs/${job.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${statusConfig.color}`} />
            <span className={`text-xs font-semibold uppercase ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate">
              {job.title}
            </h3>
            {job.photo_count !== undefined && (
              <PhotoCountBadge count={job.photo_count} size="sm" />
            )}
          </div>
        </Link>

        <div className="flex gap-1 flex-shrink-0 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(job) }}
          >
            <Edit className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(job.id) }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body: two column layout on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-3 text-sm">
        {/* Client */}
        {job.client && job.client_id && (
          <Link
            href={`/dashboard/customers/${job.client_id}`}
            className="flex items-center gap-2 py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors col-span-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300 flex-shrink-0">
              {job.client.name.charAt(0)}
            </div>
            <span className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{job.client.name}</span>
            {job.client.phone && (
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">{job.client.phone}</span>
            )}
          </Link>
        )}

        {/* Date */}
        {job.scheduled_date && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatJobDate(job.scheduled_date)}</span>
          </div>
        )}

        {/* Service */}
        {job.service_type && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Car className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{job.service_type}</span>
          </div>
        )}

        {/* Vehicle condition */}
        {job.vehicle_condition && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-400 text-xs">Condition:</span>
            <span>{job.vehicle_condition}</span>
          </div>
        )}

        {/* Duration */}
        {job.estimated_duration && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{job.estimated_duration} min</span>
          </div>
        )}

        {/* Assigned member */}
        {job.assignments && job.assignments.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{job.assignments[0].team_member.name}</span>
          </div>
        )}

        {/* Vehicle */}
        {job.asset_details && Object.keys(job.asset_details).length > 0 && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 col-span-full">
            <Car className="h-3.5 w-3.5 text-cyan-600 flex-shrink-0" />
            <span>{Object.values(job.asset_details).join(' • ')}</span>
          </div>
        )}

        {/* Add-ons */}
        {job.addons && job.addons.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 col-span-full">
            <span className="text-zinc-400">+</span>
            <span>{job.addons.map(a => a.name).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Location row */}
      {(job.address || (job.city && job.state)) && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <MapPin className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
          {job.address ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${job.address}, ${job.city || ''} ${job.state || ''} ${job.zip || ''}`.trim()
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {job.address}, {job.city}, {job.state}
            </a>
          ) : (
            <span className="flex-1 text-zinc-600 dark:text-zinc-400">{job.city}, {job.state}</span>
          )}
          {job.address && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs shrink-0"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${job.address}, ${job.city || ''} ${job.state || ''} ${job.zip || ''}`.trim()
                  )}`,
                  '_blank'
                )
              }}
            >
              <Navigation className="h-3.5 w-3.5 mr-1" />
              Route
            </Button>
          )}
        </div>
      )}

      {/* Mileage */}
      {job.mileage_record && (
        <div className="mb-3">
          <MileageDisplay
            jobId={job.id}
            mileageId={job.mileage_record.id}
            miles={job.mileage_record.miles_driven}
            isManualOverride={job.mileage_record.is_manual_override}
            fromAddress={job.mileage_record.from_address ?
              `${job.mileage_record.from_address}, ${job.mileage_record.from_city || ''} ${job.mileage_record.from_state || ''}`.trim() :
              undefined
            }
          />
        </div>
      )}

      {/* Footer: price + action button */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-700 gap-3">
        <div className="flex items-center gap-3">
          {job.estimated_cost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-bold text-green-600">${job.estimated_cost.toFixed(2)}</span>
            </div>
          )}
        </div>

        {job.status === 'scheduled' && (
          <Button
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStatusChange(job.id, 'in_progress') }}
          >
            <Play className="h-4 w-4 mr-1.5" />
            Start Job
          </Button>
        )}
        {job.status === 'in_progress' && (
          <Button
            className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStatusChange(job.id, 'completed') }}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Complete Job
          </Button>
        )}
      </div>
    </Card>
  )
}
