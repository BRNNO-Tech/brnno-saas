'use server'

import { createClient } from '@/lib/supabase/server'
import { getWorkerProfile } from './worker-auth'

/**
 * Gets scheduled jobs for the worker (only their assigned jobs)
 */
export async function getWorkerScheduledJobs(startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const worker = await getWorkerProfile()
  
  if (!worker) {
    throw new Error('Worker not found')
  }

  // Get job assignments for this worker
  let query = supabase
    .from('job_assignments')
    .select(`
      *,
      job:jobs(
        *,
        client:clients(name, phone, email)
      )
    `)
    .eq('team_member_id', worker.id)
    .order('assigned_at', { ascending: false })

  const { data: assignments, error } = await query

  if (error) {
    console.error('Error fetching worker jobs:', error)
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  if (!assignments) {
    return []
  }

  // Filter by date range if provided
  let jobs = assignments
    .map(a => a.job)
    .filter(job => job && job.scheduled_date)
    .filter(job => {
      if (!startDate || !endDate) return true
      const jobDate = new Date(job.scheduled_date)
      return jobDate >= new Date(startDate) && jobDate <= new Date(endDate)
    })

  // Filter to only scheduled and in_progress jobs for calendar view
  jobs = jobs.filter(job => 
    job.status === 'scheduled' || job.status === 'in_progress'
  )

  return jobs
}

