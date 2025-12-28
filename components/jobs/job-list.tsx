'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Play, CheckCircle, XCircle, Edit } from 'lucide-react'
import { deleteJob, updateJobStatus } from '@/lib/actions/jobs'
import EditJobSheet from './edit-job-dialog'
import AssignJobDialog from './assign-job-dialog'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  client: { name: string } | null
  assignments?: {
    id: string
    team_member: {
      id: string
      name: string
      role: string
    }
  }[]
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await deleteJob(id)
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }

  async function handleStatusChange(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      await updateJobStatus(id, status)
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border-transparent">
            Completed
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border-transparent">
            In Progress
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border-transparent">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 border-transparent">
            {status.replace('_', ' ')}
          </Badge>
        )
    }
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No jobs scheduled. Create your first job to get started.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  {getStatusBadge(job.status)}
                  <Badge variant={
                    job.priority === 'urgent' ? 'destructive' :
                      job.priority === 'high' ? 'secondary' :
                        'outline'
                  }>
                    {job.priority}
                  </Badge>

                  {/* Show assigned team member */}
                  {job.assignments && job.assignments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600">
                        {job.assignments[0].team_member.name.charAt(0)}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {job.assignments[0].team_member.name}
                      </span>
                    </div>
                  )}
                </div>

                {job.client && (
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {job.client.name}
                  </p>
                )}

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleString() : 'Not scheduled'}
                  {job.service_type && ` • ${job.service_type}`}
                  {job.address && ` • ${job.city}, ${job.state}`}
                </p>

                {job.estimated_cost && (
                  <p className="mt-2 font-semibold">
                    ${job.estimated_cost.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {job.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => handleStatusChange(job.id, 'in_progress')}
                  >
                    <Play className="mr-2 h-3.5 w-3.5" />
                    Start
                  </Button>
                )}

                {job.status === 'in_progress' && (
                  <Button
                    size="sm"
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStatusChange(job.id, 'completed')}
                  >
                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                    Complete
                  </Button>
                )}

                {job.status !== 'cancelled' && job.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={() => handleStatusChange(job.id, 'cancelled')}
                  >
                    <XCircle className="mr-2 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingJob(job)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <AssignJobDialog
                  jobId={job.id}
                  currentAssignment={job.assignments?.[0]?.team_member}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
