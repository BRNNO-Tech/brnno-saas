'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Car,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react'
import AssignJobDialog from './assign-job-dialog'
import { formatJobDate } from '@/lib/utils/date-format'

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
  client: { name: string; phone?: string } | null
  asset_details?: Record<string, any> | null
}

type TeamMember = {
  id: string
  name: string
  role: string
  total_jobs_completed: number
}

export default function UnassignedJobsList({ 
  jobs, 
  teamMembers 
}: { 
  jobs: Job[]
  teamMembers: TeamMember[]
}) {
  if (jobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">All caught up!</h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          No unassigned jobs. Great work!
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <Card 
          key={job.id} 
          className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950 hover:shadow-lg transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase text-orange-700 dark:text-orange-300">
                  Needs Assignment
                </span>
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                {job.title}
              </h3>
            </div>
            
            {/* Priority Badge */}
            {job.priority === 'urgent' && (
              <Badge variant="destructive" className="ml-2">
                Urgent
              </Badge>
            )}
          </div>

          {/* Customer Info */}
          {job.client && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-orange-200 dark:border-orange-800">
              <div className="h-8 w-8 rounded-full bg-orange-200 dark:bg-orange-900 flex items-center justify-center text-sm font-semibold text-orange-700 dark:text-orange-300">
                {job.client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">
                  {job.client.name}
                </p>
                {job.client.phone && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {job.client.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vehicle/Asset Details */}
          {job.asset_details && Object.keys(job.asset_details).length > 0 && (
            <div className="flex items-start gap-2 mb-3 text-sm">
              <Car className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
              <p className="text-zinc-700 dark:text-zinc-300">
                {Object.entries(job.asset_details)
                  .map(([key, value]) => value)
                  .join(' • ')}
              </p>
            </div>
          )}

          {/* Date & Time */}
          {job.scheduled_date && (
            <div className="flex items-center gap-2 mb-2 text-sm">
              <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                {formatJobDate(job.scheduled_date)}
              </span>
            </div>
          )}

          {/* Location */}
          {job.city && job.state && (
            <div className="flex items-center gap-2 mb-2 text-sm">
              <MapPin className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                {job.city}, {job.state}
              </span>
            </div>
          )}

          {/* Price & Duration */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-4">
              {job.estimated_cost && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-600">
                    ${job.estimated_cost.toFixed(2)}
                  </span>
                </div>
              )}
              
              {job.estimated_duration && (
                <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{job.estimated_duration} min</span>
                </div>
              )}
            </div>

            {/* Assign Button */}
            <div onClick={(e) => e.stopPropagation()}>
              <AssignJobDialog
                jobId={job.id}
                currentAssignment={null}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
