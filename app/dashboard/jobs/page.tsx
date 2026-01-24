export const dynamic = 'force-dynamic'

import { getJobs } from '@/lib/actions/jobs'
import { getTeamMembers } from '@/lib/actions/team'
import JobList from '@/components/jobs/job-list'
import UnassignedJobsList from '@/components/jobs/unassigned-jobs-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CreateJobButton from '@/components/jobs/create-job-button'
import { GlowBG } from '@/components/ui/glow-bg'
import { Users } from 'lucide-react'

export default async function JobsPage() {
  const jobs = await getJobs()
  const teamMembers = await getTeamMembers()

  // Deduplicate jobs by ID to prevent ghost duplicates from network issues
  const uniqueJobs = jobs.filter((job, index, self) => 
    index === self.findIndex((j) => j.id === job.id)
  )

  const hasTeam = teamMembers.length > 0

  const unassignedJobs = uniqueJobs.filter(job =>
    !job.assignments || job.assignments.length === 0
  )

  const assignedJobs = uniqueJobs.filter(job =>
    job.assignments && job.assignments.length > 0
  )

  // Map team members to include required fields with defaults
  const mappedTeamMembers = teamMembers.map(m => ({
    ...m,
    total_jobs_completed: (m as any).total_jobs_completed || 0,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {hasTeam ? 'Jobs & Team' : 'My Jobs'}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                {hasTeam 
                  ? 'Manage and assign jobs to your team' 
                  : 'Manage your scheduled jobs'
                }
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <CreateJobButton />
            </div>
          </div>

          {/* Show tabs only if has team */}
          {hasTeam ? (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  All Jobs ({jobs.length})
                </TabsTrigger>
                <TabsTrigger value="unassigned" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  <span className="flex items-center gap-2">
                    Unassigned ({unassignedJobs.length})
                    {unassignedJobs.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="assigned" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  <Users className="h-4 w-4 mr-2" />
                  Assigned ({assignedJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <JobList jobs={uniqueJobs} />
              </TabsContent>

              <TabsContent value="unassigned">
                <UnassignedJobsList jobs={unassignedJobs} teamMembers={mappedTeamMembers} />
              </TabsContent>

              <TabsContent value="assigned">
                <JobList jobs={assignedJobs} />
              </TabsContent>
            </Tabs>
          ) : (
            // Solo view - just show all jobs, no tabs
            <JobList jobs={uniqueJobs} />
          )}
        </div>
      </div>
    </div>
  )
}
