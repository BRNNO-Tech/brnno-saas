import { getJobs } from '@/lib/actions/jobs'
import CreateJobButton from '@/components/jobs/create-job-button'
import JobList from '@/components/jobs/job-list'

export default async function JobsPage() {
  const jobs = await getJobs()
  
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

