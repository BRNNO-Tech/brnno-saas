import { getWorkerProfile, getWorkerJobs } from '@/lib/actions/worker-auth'
import { redirect } from 'next/navigation'
import WorkerJobList from '@/components/worker/worker-job-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkerDashboardPage() {
  const worker = await getWorkerProfile()

  if (!worker) {
    redirect('/login')
  }

  const assignments = await getWorkerJobs()

  // Filter jobs by status
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayJobs = assignments.filter(a => {
    if (!a.job.scheduled_date) return false
    const jobDate = new Date(a.job.scheduled_date)
    jobDate.setHours(0, 0, 0, 0)
    return jobDate.getTime() === today.getTime() && a.job.status !== 'completed'
  })

  const upcomingJobs = assignments.filter(a => {
    if (!a.job.scheduled_date) return false
    const jobDate = new Date(a.job.scheduled_date)
    return jobDate > today && a.job.status !== 'completed'
  })

  const completedJobs = assignments.filter(a => a.job.status === 'completed')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Welcome, {worker.name}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {worker.business?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Today's Jobs
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Upcoming
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Completed
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedJobs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Jobs */}
        {todayJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Today's Jobs</h2>
            <WorkerJobList assignments={todayJobs} />
          </div>
        )}

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Jobs</h2>
            <WorkerJobList assignments={upcomingJobs} />
          </div>
        )}

        {/* Completed */}
        {completedJobs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
            <WorkerJobList assignments={completedJobs.slice(0, 5)} />
          </div>
        )}

        {/* Empty State */}
        {assignments.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No jobs assigned yet</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Check back later or contact your manager.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
