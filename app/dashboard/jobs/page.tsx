export const dynamic = 'force-dynamic'

import { getJobs } from '@/lib/actions/jobs'
import { getTeamMembers } from '@/lib/actions/team'
import JobList from '@/components/jobs/job-list'
import CreateJobButton from '@/components/jobs/create-job-button'

export default async function JobsPage() {
  const jobs = await getJobs()
  const teamMembers = await getTeamMembers()

  const uniqueJobs = jobs.filter((job, index, self) =>
    index === self.findIndex((j) => j.id === job.id)
  )

  const mappedTeamMembers = teamMembers.map(m => ({
    ...m,
    total_jobs_completed: (m as any).total_jobs_completed || 0,
  }))

  return (
    <div className="w-full pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            {teamMembers.length > 0 ? 'Jobs & Team' : 'My Jobs'}
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            {uniqueJobs.length} total jobs
          </p>
        </div>
        <CreateJobButton />
      </div>

      <JobList jobs={uniqueJobs} teamMembers={mappedTeamMembers} />
    </div>
  )
}
