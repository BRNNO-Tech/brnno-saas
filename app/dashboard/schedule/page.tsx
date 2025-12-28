export const dynamic = 'force-dynamic'

import { getScheduledJobs, getTimeBlocks } from '@/lib/actions/schedule'
import ScheduleCalendar from '@/components/schedule/schedule-calendar'

export default async function SchedulePage() {
  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  let jobs = []
  let timeBlocks = []

  try {
    jobs = await getScheduledJobs(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    )
    timeBlocks = await getTimeBlocks(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    )
  } catch (error) {
    console.error('Error loading schedule data:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Schedule
          </h1>
          <p className="mt-2 text-zinc-400">
            Month view of all your bookings
          </p>
        </div>
      </div>

      <ScheduleCalendar
        initialJobs={jobs}
        initialTimeBlocks={timeBlocks}
      />
    </div>
  )
}
