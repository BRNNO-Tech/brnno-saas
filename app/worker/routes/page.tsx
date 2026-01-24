import { getWorkerProfile, getWorkerJobs } from '@/lib/actions/worker-auth'
import { redirect } from 'next/navigation'
import WorkerRouteMap from '@/components/worker/worker-route-map'

export const dynamic = 'force-dynamic'

export default async function WorkerRoutesPage() {
  const worker = await getWorkerProfile()
  
  if (!worker) {
    redirect('/login')
  }

  const assignments = await getWorkerJobs()
  
  // Filter to only scheduled and in_progress jobs with addresses
  const jobsWithAddresses = assignments
    .map(a => a.job)
    .filter(job => {
      if (job.status === 'completed') return false
      if (!job.scheduled_date) return false
      // Check if job has address
      const hasJobAddress = job.address && job.city
      const hasClientAddress = job.client?.address && job.client?.city
      return hasJobAddress || hasClientAddress
    })

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Route Optimization</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                View all your jobs on a map and get optimized routes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <WorkerRouteMap jobs={jobsWithAddresses} />
      </div>
    </>
  )
}

