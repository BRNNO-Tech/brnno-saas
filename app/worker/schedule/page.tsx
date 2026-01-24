import { getWorkerScheduledJobs } from '@/lib/actions/worker-schedule'
import { redirect } from 'next/navigation'
import { getWorkerProfile } from '@/lib/actions/worker-auth'
import WorkerScheduleCalendar from '@/components/worker/worker-schedule-calendar'

export const dynamic = 'force-dynamic'

export default async function WorkerSchedulePage() {
  const worker = await getWorkerProfile()
  
  if (!worker) {
    redirect('/login')
  }

  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  let jobs = []

  try {
    jobs = await getWorkerScheduledJobs(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    )
  } catch (error) {
    console.error('Error loading schedule data:', error)
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">My Schedule</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                View all your assigned jobs
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <WorkerScheduleCalendar initialJobs={jobs} />
      </div>
    </>
  )
}

