export const dynamic = 'force-dynamic'

import { getScheduledJobs, getTimeBlocks } from '@/lib/actions/schedule'
import ScheduleCalendar from '@/components/schedule/schedule-calendar'
import { GlowBG } from '@/components/ui/glow-bg'

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
                Calendar
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Month view of all your bookings
              </p>
            </div>
          </div>

          <ScheduleCalendar
            initialJobs={jobs}
            initialTimeBlocks={timeBlocks}
          />
        </div>
      </div>
    </div>
  )
}
