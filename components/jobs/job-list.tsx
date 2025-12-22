'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Play, CheckCircle, XCircle, Edit } from 'lucide-react'
import { deleteJob, updateJobStatus } from '@/lib/actions/jobs'
import EditJobDialog from './edit-job-dialog'
import { useState } from 'react'

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
          <Card key={job.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <Badge variant={
                    job.status === 'completed' ? 'default' :
                    job.status === 'in_progress' ? 'secondary' :
                    job.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }>
                    {job.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={
                    job.priority === 'urgent' ? 'destructive' :
                    job.priority === 'high' ? 'secondary' :
                    'outline'
                  }>
                    {job.priority}
                  </Badge>
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
                    onClick={() => handleStatusChange(job.id, 'in_progress')}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                )}
                
                {job.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(job.id, 'completed')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                )}
                
                {job.status !== 'cancelled' && job.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(job.id, 'cancelled')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingJob(job)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingJob && (
        <EditJobDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
        />
      )}
    </>
  )
}

