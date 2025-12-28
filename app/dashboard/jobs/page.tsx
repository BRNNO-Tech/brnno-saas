export const dynamic = 'force-dynamic'

import { getJobs } from '@/lib/actions/jobs'
import { getTeamMembers } from '@/lib/actions/team'
import JobList from '@/components/jobs/job-list'
import UnassignedJobsList from '@/components/jobs/unassigned-jobs-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CreateJobButton from '@/components/jobs/create-job-button'

export default async function JobsPage() {
  const jobs = await getJobs()
  const teamMembers = await getTeamMembers()

  const unassignedJobs = jobs.filter(job =>
    !job.assignments || job.assignments.length === 0
  )

  const assignedJobs = jobs.filter(job =>
    job.assignments && job.assignments.length > 0
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs</h1>
          <p className="text-zinc-400">
            Manage and track all jobs
          </p>
        </div>
        <CreateJobButton />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Jobs ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="unassigned">
            Unassigned ({unassignedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Assigned ({assignedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <JobList jobs={jobs} />
        </TabsContent>

        <TabsContent value="unassigned">
          <UnassignedJobsList jobs={unassignedJobs} teamMembers={teamMembers} />
        </TabsContent>

        <TabsContent value="assigned">
          <JobList jobs={assignedJobs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
