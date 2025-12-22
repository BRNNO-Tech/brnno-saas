import { getJobs } from '@/lib/actions/jobs'
import CreateJobButton from '@/components/jobs/create-job-button'
import JobList from '@/components/jobs/job-list'

export default async function JobsPage() {
  let jobs
  try {
    jobs = await getJobs()
  } catch (error) {
    console.error('Error loading jobs:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load jobs
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading jobs.'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Jobs
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Schedule and manage jobs
          </p>
        </div>
        <CreateJobButton />
      </div>
      
      <JobList jobs={jobs} />
    </div>
  )
}

