export const dynamic = 'force-dynamic'

import { getJobs } from '@/lib/actions/jobs'
import { getTeamMembers } from '@/lib/actions/team'
import JobList from '@/components/jobs/job-list'

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
      <JobList jobs={uniqueJobs} teamMembers={mappedTeamMembers} />
    </div>
  )
}
