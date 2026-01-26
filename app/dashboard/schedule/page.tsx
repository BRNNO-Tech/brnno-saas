export const dynamic = 'force-dynamic'

import { getScheduledJobs, getTimeBlocks, getPriorityBlocks } from '@/lib/actions/schedule'
import { getTeamMembers } from '@/lib/actions/team'
import { getBusinessId } from '@/lib/actions/utils'
import { getBusiness } from '@/lib/actions/business'
import { getClients } from '@/lib/actions/clients'
import { getSmartNotifications, generateSmartNotifications } from '@/lib/actions/notifications'
import ScheduleCalendar from '@/components/schedule/schedule-calendar'
import SmartNotificationsBanner from '@/components/notifications/smart-notifications-banner'
import { GlowBG } from '@/components/ui/glow-bg'

export default async function SchedulePage() {
  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  let jobs = []
  let timeBlocks = []
  let teamMembers: any[] = []
  let businessId = ''
  let businessAddress: string | null = null
  let notifications: any[] = []

  try {
    businessId = await getBusinessId()

    // Fetch all data needed for notifications and calendar
    const [
      scheduleJobs,
      scheduleBlocks,
      team,
      business,
      clients,
      priorityBlocks
    ] = await Promise.all([
      getScheduledJobs(startOfMonth.toISOString(), endOfMonth.toISOString()),
      getTimeBlocks(startOfMonth.toISOString(), endOfMonth.toISOString()),
      getTeamMembers(),
      getBusiness(),
      getClients(),
      getPriorityBlocks(businessId)
    ])

    jobs = scheduleJobs
    timeBlocks = scheduleBlocks
    teamMembers = team

    if (business) {
      businessAddress = business.city && business.state
        ? `${business.city}, ${business.state}`
        : business.zip
          ? business.zip
          : null
    }

    // Get all completed jobs for customer pattern analysis
    const supabase = await (await import('@/lib/supabase/server')).createClient()
    const { data: allJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId)
      .or('status.eq.completed,status.eq.scheduled')

    // Generate smart notifications
    await generateSmartNotifications(
      businessId,
      allJobs || [],
      priorityBlocks,
      clients
    )

    // Get active notifications to display
    notifications = await getSmartNotifications()
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

          {/* Smart Notifications Banner */}
          <SmartNotificationsBanner initialNotifications={notifications} />

          <ScheduleCalendar
            initialJobs={jobs}
            initialTimeBlocks={timeBlocks}
            teamMembers={teamMembers}
            businessId={businessId}
            businessAddress={businessAddress}
          />
        </div>
      </div>
    </div>
  )
}
