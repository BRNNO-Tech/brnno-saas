'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CardShell } from '@/components/ui/card-shell'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X, Globe, Pencil } from 'lucide-react'
import { getScheduledJobs, getTimeBlocks, createTimeBlock, deleteTimeBlock, updateJobDate, updateTimeBlock } from '@/lib/actions/schedule'
import { assignJobToMember } from '@/lib/actions/team'
import AddTimeBlockDialog from './add-time-block-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Job = {
  id: string
  title: string
  scheduled_date: string | null
  estimated_duration: number | null
  estimated_cost: number | null
  status: string
  client: { name: string } | null
  assignments?: Array<{
    team_member_id: string
    team_member: { id: string; name: string }
  }>
}

type TimeBlock = {
  id: string
  title: string
  start_time: string
  end_time: string
  type: 'personal' | 'holiday' | 'unavailable'
  description: string | null
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_end_date?: string | null
  recurrence_count?: number | null
  is_recurring_instance?: boolean
  original_id?: string
}

export default function ScheduleCalendar({
  initialJobs,
  initialTimeBlocks,
  teamMembers = [],
  businessId
}: {
  initialJobs: Job[]
  initialTimeBlocks: TimeBlock[]
  teamMembers?: any[]
  businessId: string
}) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks)
  const [priorityBlocks, setPriorityBlocks] = useState<any[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null)
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)
  // Add timezone state - default to user's local timezone
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Team coordination state
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(
    teamMembers.map(m => m.id)
  )

  const teamMemberColors: Record<string, { bg: string; border: string; text: string }> = {}
  const colorPalette = [
    { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-800', text: 'text-pink-800 dark:text-pink-200' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-200' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-200' },
    { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-200' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-300 dark:border-indigo-800', text: 'text-indigo-800 dark:text-indigo-200' },
    { bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-800 dark:text-teal-200' },
  ]

  teamMembers.forEach((member, index) => {
    teamMemberColors[member.id] = colorPalette[index % colorPalette.length]
  })

  teamMemberColors['owner'] = {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    border: 'border-cyan-300 dark:border-cyan-800',
    text: 'text-cyan-800 dark:text-cyan-200'
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generate calendar days
  const calendarDays: (Date | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  // Helper function to compare dates in local timezone (ignoring time)
  function isSameLocalDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
  }

  // Get events for a specific date
  function getEventsForDate(date: Date | null): { jobs: Job[]; timeBlocks: TimeBlock[] } {
    if (!date) return { jobs: [], timeBlocks: [] }

    // Use local date comparison instead of UTC to avoid timezone issues
    const dayJobs = jobs.filter(job => {
      if (!job.scheduled_date) return false
      const jobDate = new Date(job.scheduled_date)
      return isSameLocalDate(jobDate, date)
    }).filter(isJobVisible)

    const dayTimeBlocks = timeBlocks.filter(block => {
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)
      // Check if the date falls within the time block range
      return isSameLocalDate(blockStart, date) ||
        isSameLocalDate(blockEnd, date) ||
        (blockStart < date && blockEnd > date)
    })

    return { jobs: dayJobs, timeBlocks: dayTimeBlocks }
  }

  // Check if a time slot has a priority block
  function getPriorityBlockForTime(date: Date, hour: number): any | null {
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()]

    for (const block of priorityBlocks) {
      if (!block.enabled) continue
      if (!block.days.includes(dayOfWeek)) continue

      const [blockStartHour] = block.start_time.split(':').map(Number)
      const [blockEndHour] = block.end_time.split(':').map(Number)

      if (hour >= blockStartHour && hour < blockEndHour) {
        return block
      }
    }

    return null
  }

  type RevenueColor = 'cyan' | 'blue' | 'emerald'

  // Get color based on job value
  function getRevenueColor(cost: number | null): RevenueColor {
    if (!cost) return 'cyan'
    if (cost >= 200) return 'emerald'
    if (cost >= 100) return 'blue'
    return 'cyan'
  }

  function getRevenueClasses(color: RevenueColor) {
    const map = {
      cyan: {
        card: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-200 dark:hover:bg-cyan-900/50',
        icon: 'text-cyan-600 dark:text-cyan-400',
        text: 'text-cyan-800 dark:text-cyan-200',
        title: 'text-cyan-900 dark:text-cyan-100',
        sub: 'text-cyan-700 dark:text-cyan-300'
      },
      blue: {
        card: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
        title: 'text-blue-900 dark:text-blue-100',
        sub: 'text-blue-700 dark:text-blue-300'
      },
      emerald: {
        card: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-800 dark:text-emerald-200',
        title: 'text-emerald-900 dark:text-emerald-100',
        sub: 'text-emerald-700 dark:text-emerald-300'
      }
    } as const

    return map[color]
  }

  // Calculate total revenue for a date
  function getDailyRevenue(date: Date | null): number {
    if (!date) return 0
    const events = getEventsForDate(date)
    return events.jobs.reduce((sum, job) => sum + (job.estimated_cost || 0), 0)
  }

  // Format time from datetime string
  // The datetime comes from the database as an ISO string (UTC)
  // We need to display it in the user's selected timezone
  function formatTime(datetime: string): string {
    if (!datetime) return ''

    try {
      const date = new Date(datetime)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', datetime)
        return ''
      }

      // Format in local timezone (consistent with position calculations)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
        // Removed timeZone to use local timezone consistently
      })
    } catch (error) {
      console.error('Error formatting time:', error, datetime)
      return ''
    }
  }

  // Navigate months
  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  // Navigate days (for daily view)
  function goToPreviousDay() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  function goToNextDay() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  // Generate hourly slots for daily view (6 AM to 10 PM)
  const hourlySlots = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM

  // Reload data when month or view changes
  useEffect(() => {
    let startDate: Date
    let endDate: Date

    if (view === 'day') {
      // For daily view, load just the selected day
      startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      // For weekly view, load the week containing currentDate
      const dayOfWeek = currentDate.getDay()
      startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // For monthly view, load the entire month
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0, 23, 59, 59)
    }

    async function loadData() {
      try {
        const [newJobs, newTimeBlocks, priorityBlocksData] = await Promise.all([
          getScheduledJobs(startDate.toISOString(), endDate.toISOString()),
          getTimeBlocks(startDate.toISOString(), endDate.toISOString()),
          businessId
            ? fetch(`/api/priority-blocks?businessId=${businessId}`).then((r) => r.json())
            : Promise.resolve({ blocks: [] })
        ])
        setJobs(newJobs)
        setTimeBlocks(newTimeBlocks)
        setPriorityBlocks(priorityBlocksData.blocks || [])
      } catch (error) {
        console.error('Error loading schedule data:', error)
      }
    }

    loadData()
  }, [year, month, view, currentDate, businessId])

  // Handle time block creation
  async function handleAddTimeBlock(data: {
    title: string
    start_time: string
    end_time: string
    type: 'personal' | 'holiday' | 'unavailable'
    description?: string | null
    is_recurring?: boolean
    recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
    recurrence_end_date?: string | null
    recurrence_count?: number | null
  }) {
    try {
      if (editingTimeBlock) {
        const targetId = editingTimeBlock.original_id || editingTimeBlock.id
        await updateTimeBlock(targetId, data)
      } else {
        await createTimeBlock(data)
      }
      // Reload data to get expanded recurring blocks
      const startDate = view === 'day'
        ? new Date(currentDate).setHours(0, 0, 0, 0)
        : view === 'week'
          ? (() => {
            const dayOfWeek = currentDate.getDay()
            const weekStart = new Date(currentDate)
            weekStart.setDate(currentDate.getDate() - dayOfWeek)
            weekStart.setHours(0, 0, 0, 0)
            return weekStart.getTime()
          })()
          : new Date(year, month, 1).getTime()

      const endDate = view === 'day'
        ? new Date(currentDate).setHours(23, 59, 59, 999)
        : view === 'week'
          ? (() => {
            const dayOfWeek = currentDate.getDay()
            const weekStart = new Date(currentDate)
            weekStart.setDate(currentDate.getDate() - dayOfWeek)
            weekStart.setHours(0, 0, 0, 0)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            return weekEnd.getTime()
          })()
          : new Date(year, month + 1, 0, 23, 59, 59).getTime()

      const [newJobs, newTimeBlocks] = await Promise.all([
        getScheduledJobs(new Date(startDate).toISOString(), new Date(endDate).toISOString()),
        getTimeBlocks(new Date(startDate).toISOString(), new Date(endDate).toISOString())
      ])
      setJobs(newJobs)
      setTimeBlocks(newTimeBlocks)
      setShowAddDialog(false)
      setEditingTimeBlock(null)
    } catch (error) {
      console.error('Error creating time block:', error)
      alert('Failed to create time block')
    }
  }

  // Handle time block deletion
  async function handleDeleteTimeBlock(id: string) {
    if (!confirm('Are you sure you want to delete this time block?')) return

    try {
      await deleteTimeBlock(id)
      setTimeBlocks(timeBlocks.filter(block => block.id !== id))
    } catch (error) {
      console.error('Error deleting time block:', error)
      alert('Failed to delete time block')
    }
  }

  function handleEditTimeBlock(block: TimeBlock) {
    setEditingTimeBlock(block)
    setShowAddDialog(true)
  }

  // Handle drag and drop for jobs
  function handleDragStart(e: React.DragEvent, job: Job) {
    setDraggedJob(job)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e: React.DragEvent, targetDate: Date | null, targetMemberId?: string) {
    e.preventDefault()
    if (!draggedJob || !targetDate) {
      setDraggedJob(null)
      return
    }

    // Preserve the time from the original scheduled date, or use a default time
    let newDateTime = new Date(targetDate)
    if (draggedJob.scheduled_date) {
      const originalDate = new Date(draggedJob.scheduled_date)
      newDateTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0)
    } else {
      // Default to 9 AM if no time was set
      newDateTime.setHours(9, 0, 0, 0)
    }

    try {
      await updateJobDate(draggedJob.id, newDateTime.toISOString())

      if (targetMemberId) {
        await assignJobToMember(draggedJob.id, targetMemberId)
      }

      // Update local state
      setJobs(jobs.map(job =>
        job.id === draggedJob.id
          ? {
            ...job,
            scheduled_date: newDateTime.toISOString(),
            ...(targetMemberId && {
              assignments: [{
                team_member_id: targetMemberId,
                team_member: teamMembers.find((m: any) => m.id === targetMemberId)
              }]
            })
          }
          : job
      ))

      // Force refresh all server data (jobs page, etc.)
      router.refresh()
    } catch (error) {
      console.error('Error updating job date:', error)
      alert('Failed to move job')
    }

    setDraggedJob(null)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  function getJobColor(job: Job): { bg: string; border: string; text: string } {
    if (!job.assignments || job.assignments.length === 0) {
      return teamMemberColors['owner']
    }

    const assignedMemberId = job.assignments[0].team_member_id
    return teamMemberColors[assignedMemberId] || teamMemberColors['owner']
  }

  function isJobVisible(job: Job): boolean {
    if (!job.assignments || job.assignments.length === 0) {
      return true
    }

    const assignedMemberId = job.assignments[0].team_member_id
    return selectedTeamMembers.includes(assignedMemberId)
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {view === 'day'
              ? currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : view === 'week'
                ? `Week of ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                : `${monthNames[month]} ${year}`
            }
          </h2>
          <div className="flex items-center gap-2">
            {view === 'day' ? (
              <>
                <button
                  onClick={goToPreviousDay}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNextDay}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : view === 'week' ? (
              <>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(newDate.getDate() - 7)
                    setCurrentDate(newDate)
                  }}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(newDate.getDate() + 7)
                    setCurrentDate(newDate)
                  }}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToPreviousMonth}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Timezone Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {(() => {
                    const tzNames: Record<string, string> = {
                      'America/New_York': 'ET',
                      'America/Chicago': 'CT',
                      'America/Denver': 'MT',
                      'America/Los_Angeles': 'PT',
                      'America/Phoenix': 'MST',
                      'America/Anchorage': 'AKT',
                      'Pacific/Honolulu': 'HST',
                      'UTC': 'UTC',
                    }
                    return tzNames[timezone] || timezone.split('/').pop()?.replace('_', ' ') || timezone
                  })()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {[
                { value: 'America/New_York', label: 'Eastern Time (ET)' },
                { value: 'America/Chicago', label: 'Central Time (CT)' },
                { value: 'America/Denver', label: 'Mountain Time (MT)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                { value: 'America/Phoenix', label: 'Arizona (MST)' },
                { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
                { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
                { value: 'UTC', label: 'UTC' },
              ].map(tz => (
                <DropdownMenuItem
                  key={tz.value}
                  onClick={() => setTimezone(tz.value)}
                  className={timezone === tz.value ? 'bg-accent' : ''}
                >
                  {tz.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-1">
            <button
              onClick={() => setView('day')}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm transition-colors",
                view === 'day'
                  ? "bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                  : "text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
              )}
            >
              Daily
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm transition-colors",
                view === 'week'
                  ? "bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                  : "text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm transition-colors",
                view === 'month'
                  ? "bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                  : "text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
              )}
            >
              Monthly
            </button>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Block Time
          </button>
        </div>
      </div>

      {/* Team Member Filters */}
      {teamMembers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-white/10">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Team:</span>

          <button
            onClick={() => {
              // Owner always shown
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              teamMemberColors['owner'].bg,
              teamMemberColors['owner'].border,
              teamMemberColors['owner'].text,
              'border'
            )}
          >
            You (Owner)
          </button>

          {teamMembers.map(member => {
            const isSelected = selectedTeamMembers.includes(member.id)
            const colors = teamMemberColors[member.id]

            return (
              <button
                key={member.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id))
                  } else {
                    setSelectedTeamMembers([...selectedTeamMembers, member.id])
                  }
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  isSelected ? colors.bg : 'bg-zinc-100 dark:bg-zinc-800',
                  isSelected ? colors.border : 'border-zinc-300 dark:border-zinc-600',
                  isSelected ? colors.text : 'text-zinc-600 dark:text-zinc-400',
                  !isSelected && 'opacity-50'
                )}
              >
                {member.name}
              </button>
            )
          })}

          <button
            onClick={() => {
              if (selectedTeamMembers.length === teamMembers.length) {
                setSelectedTeamMembers([])
              } else {
                setSelectedTeamMembers(teamMembers.map(m => m.id))
              }
            }}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {selectedTeamMembers.length === teamMembers.length ? 'Clear All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Daily View */}
      {view === 'day' && (
        <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-0">
            <div className="flex">
              {/* Time Column */}
              <div className="w-20 border-r border-zinc-200/50 dark:border-white/10 p-2 bg-zinc-50/50 dark:bg-black/20">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 font-medium">Time</div>
              </div>
              {/* Timeline Column */}
              <div className="flex-1">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 p-2 border-b border-zinc-200/50 dark:border-white/10 font-medium">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {hourlySlots.map((hour) => {
                const hourStart = new Date(currentDate)
                hourStart.setHours(hour, 0, 0, 0)
                const hourEnd = new Date(currentDate)
                hourEnd.setHours(hour, 59, 59, 999)

                // Get time blocks for this hour
                const hourTimeBlocks = timeBlocks.filter(block => {
                  const blockStart = new Date(block.start_time)
                  const blockEnd = new Date(block.end_time)
                  return (blockStart < hourEnd && blockEnd > hourStart)
                })

                return (
                  <div key={hour} className="flex border-b min-h-[80px]">
                    {/* Time Label */}
                    <div className="w-20 border-r p-2 flex-shrink-0">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    </div>
                    {/* Timeline Content */}
                    <div className="flex-1 relative p-2">
                      {/* Priority Block Overlay (background) */}
                      {(() => {
                        const priorityBlock = getPriorityBlockForTime(currentDate, hour)
                        if (!priorityBlock) return null

                        const [blockStartHour, blockStartMin] = priorityBlock.start_time.split(':').map(Number)
                        const [blockEndHour, blockEndMin] = priorityBlock.end_time.split(':').map(Number)

                        const startOffset = blockStartHour === hour ? (blockStartMin / 60) * 100 : 0
                        const endOffset = blockEndHour === hour ? (blockEndMin / 60) * 100 : 100
                        const height = endOffset - startOffset

                        return (
                          <div
                            className="absolute left-0 right-0 bg-purple-100/40 dark:bg-purple-900/20 border-l-4 border-purple-500"
                            style={{
                              top: `${startOffset}%`,
                              height: `${height}%`,
                              pointerEvents: 'none',
                              zIndex: 0
                            }}
                          >
                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium px-1 py-0.5">
                              Priority: {priorityBlock.priority_for.replace('_', ' ')}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Time Blocks (background) */}
                      {hourTimeBlocks.map(block => {
                        const blockStart = new Date(block.start_time)
                        const blockEnd = new Date(block.end_time)
                        const blockStartHour = blockStart.getHours()
                        const blockStartMin = blockStart.getMinutes()
                        const blockEndHour = blockEnd.getHours()
                        const blockEndMin = blockEnd.getMinutes()

                        // Calculate position and height
                        const startOffset = blockStartHour === hour ? (blockStartMin / 60) * 100 : 0
                        const endOffset = blockEndHour === hour ? (blockEndMin / 60) * 100 : 100
                        const height = endOffset - startOffset

                        if (blockStartHour > hour || blockEndHour < hour) return null

                        return (
                          <div
                            key={block.id}
                            className={`absolute left-0 right-0 rounded px-2 py-1 text-xs ${block.type === 'personal'
                              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                              : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                              }`}
                            style={{
                              top: `${startOffset}%`,
                              height: `${height}%`,
                            }}
                            title={block.description || block.title}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{block.title}</span>
                            </div>
                          </div>
                        )
                      })}

                      {/* Jobs */}
                      {jobs.map(job => {
                        if (!job.scheduled_date) return null

                        const jobDate = new Date(job.scheduled_date)
                        // Compare dates in local timezone to ensure job is on the current day
                        const jobDateLocal = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate())
                        const currentDateLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())

                        // Only show jobs for the current day
                        if (jobDateLocal.getTime() !== currentDateLocal.getTime()) return null

                        // Use local timezone consistently for hour/minute calculations
                        // This ensures the displayed time matches the position on the calendar
                        const jobHour = jobDate.getHours()
                        const jobMin = jobDate.getMinutes()
                        const jobDuration = job.estimated_duration || 60 // in minutes
                        const jobEndHour = jobHour + Math.floor(jobDuration / 60)
                        const jobEndMin = jobMin + (jobDuration % 60)

                        // Check if job overlaps with this hour
                        if (jobHour > hour || (jobHour === hour && jobEndHour < hour)) return null
                        if (jobEndHour < hour) return null

                        // Calculate position and height for this hour
                        let topOffset = 0
                        let height = 100 // full hour by default

                        if (jobHour === hour) {
                          // Job starts in this hour
                          topOffset = (jobMin / 60) * 100
                          if (jobEndHour === hour) {
                            // Job ends in this hour
                            height = ((jobEndMin - jobMin) / 60) * 100
                          } else {
                            // Job continues to next hour(s)
                            height = 100 - topOffset
                          }
                        } else if (jobEndHour === hour) {
                          // Job ends in this hour
                          height = (jobEndMin / 60) * 100
                        } else if (jobHour < hour && jobEndHour > hour) {
                          // Job spans this entire hour
                          topOffset = 0
                          height = 100
                        }

                        const revenueColor = getRevenueColor(job.estimated_cost)
                        const revenueClasses = getRevenueClasses(revenueColor)

                        return (
                          <div
                            key={job.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, job)}
                            className={cn(
                              'absolute left-0 right-0 rounded-lg border px-2 py-1 text-xs cursor-move transition-colors z-10',
                              revenueClasses.card
                            )}
                            style={{
                              top: `${topOffset}%`,
                              height: `${height}%`,
                              minHeight: '30px',
                            }}
                          >
                            {jobHour === hour && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Clock className={cn('h-3 w-3', revenueClasses.icon)} />
                                  <span className={cn('font-medium', revenueClasses.text)}>
                                    {formatTime(job.scheduled_date)}
                                  </span>
                                  {job.estimated_cost && (
                                    <span className={cn('ml-auto font-semibold', revenueClasses.text)}>
                                      ${job.estimated_cost.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className={cn('truncate font-medium', revenueClasses.title)}>
                                  {job.title}
                                </div>
                                {job.client && (
                                  <div className={cn('text-xs', revenueClasses.sub)}>
                                    {job.client.name}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}

                      {/* Empty state */}
                      {(() => {
                        const hasJobsInHour = jobs.some(job => {
                          if (!job.scheduled_date) return false
                          const jobDate = new Date(job.scheduled_date)
                          const jobHour = jobDate.getHours()
                          return jobHour === hour
                        })
                        return !hasJobsInHour && hourTimeBlocks.length === 0
                      })() && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-2">
                            No events
                          </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly View */}
      {view === 'week' && (
        <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-0">
            {/* Week Header */}
            <div className="flex border-b border-zinc-200/50 dark:border-white/10">
              <div className="w-20 border-r border-zinc-200/50 dark:border-white/10 p-2 flex-shrink-0 bg-zinc-50/50 dark:bg-black/20">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Time</div>
              </div>
              {(() => {
                const weekStart = new Date(currentDate)
                weekStart.setDate(currentDate.getDate() - currentDate.getDay())
                const weekDays: Date[] = []
                for (let i = 0; i < 7; i++) {
                  const day = new Date(weekStart)
                  day.setDate(weekStart.getDate() + i)
                  weekDays.push(day)
                }
                return weekDays.map((day, index) => {
                  const isToday = day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear()
                  return (
                    <div
                      key={index}
                      className="flex-1 border-r border-zinc-200/50 dark:border-white/10 last:border-r-0 p-2 text-center bg-zinc-50/50 dark:bg-black/20"
                    >
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                        {dayNames[day.getDay()]}
                      </div>
                      <div className={cn(
                        "text-sm font-semibold",
                        isToday ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-900 dark:text-zinc-50'
                      )}>
                        {day.getDate()}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {monthNames[day.getMonth()].slice(0, 3)}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Weekly Timeline */}
            <div className="max-h-[600px] overflow-y-auto">
              {hourlySlots.map((hour) => {
                const weekStart = new Date(currentDate)
                weekStart.setDate(currentDate.getDate() - currentDate.getDay())
                weekStart.setHours(0, 0, 0, 0)
                const weekDays: Date[] = []
                for (let i = 0; i < 7; i++) {
                  const day = new Date(weekStart)
                  day.setDate(weekStart.getDate() + i)
                  weekDays.push(day)
                }

                return (
                  <div key={hour} className="flex border-b min-h-[80px]">
                    {/* Time Label */}
                    <div className="w-20 border-r p-2 flex-shrink-0">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day, dayIndex) => {
                      const dayStart = new Date(day)
                      dayStart.setHours(hour, 0, 0, 0)
                      const dayEnd = new Date(day)
                      dayEnd.setHours(hour, 59, 59, 999)

                      // Get jobs that overlap with this day and hour - use local date comparison
                      const dayJobs = jobs.filter(job => {
                        if (!job.scheduled_date) return false
                        const jobDate = new Date(job.scheduled_date)
                        // Compare dates in local timezone
                        const jobDateLocal = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate())
                        const dayLocal = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                        if (jobDateLocal.getTime() !== dayLocal.getTime()) return false

                        const jobHour = jobDate.getHours()
                        const jobDuration = job.estimated_duration || 60
                        const jobEndHour = jobHour + Math.floor(jobDuration / 60)

                        // Check if job overlaps with this hour
                        return jobHour <= hour && jobEndHour >= hour
                      })

                      // Get time blocks for this day and hour - use local date comparison
                      const dayTimeBlocks = timeBlocks.filter(block => {
                        const blockStart = new Date(block.start_time)
                        const blockEnd = new Date(block.end_time)
                        // Compare dates in local timezone
                        const blockDateLocal = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate())
                        const dayLocal = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                        return blockDateLocal.getTime() === dayLocal.getTime() && (blockStart < dayEnd && blockEnd > dayStart)
                      })

                      return (
                        <div
                          key={dayIndex}
                          className="flex-1 border-r border-zinc-200/50 dark:border-white/10 last:border-r-0 relative p-1"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day)}
                        >
                          {/* Time Blocks (background) */}
                          {dayTimeBlocks.map(block => {
                            const blockStart = new Date(block.start_time)
                            const blockEnd = new Date(block.end_time)
                            const blockStartHour = blockStart.getHours()
                            const blockStartMin = blockStart.getMinutes()
                            const blockEndHour = blockEnd.getHours()
                            const blockEndMin = blockEnd.getMinutes()

                            const startOffset = blockStartHour === hour ? (blockStartMin / 60) * 100 : 0
                            const endOffset = blockEndHour === hour ? (blockEndMin / 60) * 100 : 100
                            const height = endOffset - startOffset

                            if (blockStartHour > hour || blockEndHour < hour) return null

                            return (
                              <div
                                key={block.id}
                                className={`absolute left-0 right-0 rounded px-1 py-0.5 text-xs ${block.type === 'personal'
                                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                  : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                                  }`}
                                style={{
                                  top: `${startOffset}%`,
                                  height: `${height}%`,
                                }}
                                title={block.description || block.title}
                              >
                                <span className="truncate text-[10px]">{block.title}</span>
                              </div>
                            )
                          })}

                          {/* Jobs */}
                          {jobs.map(job => {
                            if (!job.scheduled_date) return null

                            const jobDate = new Date(job.scheduled_date)
                            // Compare dates in local timezone
                            const jobDateLocal = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate())
                            const dayLocal = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                            if (jobDateLocal.getTime() !== dayLocal.getTime()) return null

                            const jobHour = jobDate.getHours()
                            const jobMin = jobDate.getMinutes()
                            const jobDuration = job.estimated_duration || 60
                            const jobEndHour = jobHour + Math.floor(jobDuration / 60)
                            const jobEndMin = jobMin + (jobDuration % 60)

                            // Check if job overlaps with this hour
                            if (jobHour > hour || jobEndHour < hour) return null

                            // Calculate position and height for this hour
                            let topOffset = 0
                            let height = 100

                            if (jobHour === hour) {
                              // Job starts in this hour
                              topOffset = (jobMin / 60) * 100
                              if (jobEndHour === hour) {
                                // Job ends in this hour
                                height = ((jobEndMin - jobMin) / 60) * 100
                              } else {
                                // Job continues to next hour(s)
                                height = 100 - topOffset
                              }
                            } else if (jobEndHour === hour) {
                              // Job ends in this hour
                              height = (jobEndMin / 60) * 100
                            } else if (jobHour < hour && jobEndHour > hour) {
                              // Job spans this entire hour
                              topOffset = 0
                              height = 100
                            }

                            const revenueColor = getRevenueColor(job.estimated_cost)
                            const revenueClasses = getRevenueClasses(revenueColor)

                            return (
                              <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job)}
                                className={cn(
                                  'absolute left-0 right-0 rounded-lg border px-1 py-0.5 text-xs cursor-move transition-colors z-10',
                                  revenueClasses.card
                                )}
                                style={{
                                  top: `${topOffset}%`,
                                  height: `${height}%`,
                                  minHeight: '25px',
                                }}
                              >
                                {jobHour === hour && (
                                  <>
                                    <div className={cn('text-[10px] font-medium truncate', revenueClasses.title)}>
                                      {formatTime(job.scheduled_date)}
                                    </div>
                                    <div className={cn('text-[10px] truncate', revenueClasses.text)}>
                                      {job.title}
                                    </div>
                                    {job.estimated_cost && (
                                      <div className={cn('text-[9px]', revenueClasses.sub)}>
                                        ${job.estimated_cost.toFixed(0)}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-0">
            <div className="grid border-b border-zinc-200/50 dark:border-white/10" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', display: 'grid' }}>
              {dayNames.map((day, idx) => (
                <div
                  key={`header-${day}-${idx}`}
                  className="border-r border-zinc-200/50 dark:border-white/10 p-3 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 last:border-r-0 bg-zinc-50/50 dark:bg-black/20"
                  style={{ minWidth: 0, width: '100%' }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {calendarDays.map((date, index) => {
                const events = getEventsForDate(date)
                const isCurrentMonth = date !== null
                const isCurrentDay = date && isToday(date)
                const dayOfWeek = date ? date.getDay() : null
                const dayName = date ? dayNames[dayOfWeek!] : null

                // Check for holidays
                const holidays = events.timeBlocks.filter(b => b.type === 'holiday')
                const holidayLabel = holidays.length > 0 ? holidays[0].title : null

                return (
                  <div
                    key={`cell-${index}-${dayName || 'empty'}`}
                    className={cn(
                      "min-h-[120px] border-r border-b border-zinc-200/50 dark:border-white/10 p-2 last:border-r-0 transition-colors",
                      !isCurrentMonth ? 'bg-zinc-50/30 dark:bg-zinc-950/30' : 'bg-white/50 dark:bg-black/10',
                      draggedJob ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : '',
                      isCurrentDay && 'bg-cyan-50/50 dark:bg-cyan-950/20'
                    )}
                    style={{ minWidth: 0 }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                  >
                    {date && (
                      <>
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCurrentDay
                                ? 'flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold'
                                : 'text-zinc-900 dark:text-zinc-50'
                            )}
                          >
                            {date.getDate()}
                          </span>
                          {(() => {
                            const revenue = getDailyRevenue(date)
                            if (revenue === 0) return null
                            return (
                              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                                ${revenue.toFixed(0)}
                              </span>
                            )
                          })()}
                        </div>
                        {holidayLabel && (
                          <div className="mb-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            {holidayLabel}
                          </div>
                        )}
                        <div className="space-y-1">
                          {/* Time Blocks */}
                          {events.timeBlocks
                            .filter(b => b.type !== 'holiday')
                            .map(block => (
                              <div
                                key={block.id}
                                className={`group relative rounded px-2 py-1 text-xs ${block.type === 'personal'
                                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                  : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                                  }`}
                                title={block.description || block.title}
                              >
                                <div className="absolute -right-1 -top-1 hidden items-center gap-1 group-hover:flex">
                                  <button
                                    onClick={() => handleEditTimeBlock(block)}
                                    className="h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
                                    title="Edit"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTimeBlock(block.original_id || block.id)}
                                    className="h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                                    title="Delete"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="truncate">
                                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                  </span>
                                </div>
                                <div className="truncate font-medium">{block.title}</div>
                              </div>
                            ))}
                          {/* Jobs */}
                          {events.jobs.filter(isJobVisible).map(job => {
                            const colors = getJobColor(job)
                            const assignedTo = job.assignments?.[0]?.team_member?.name || 'You'

                            return (
                              <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job)}
                                className={cn(
                                  'cursor-move rounded-lg px-2 py-1 text-xs hover:opacity-80 transition-colors border',
                                  colors.bg,
                                  colors.border
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className={colors.text}>
                                    {job.scheduled_date ? formatTime(job.scheduled_date) : ''}
                                  </span>
                                  {job.estimated_cost && (
                                    <span className={cn('ml-auto font-semibold', colors.text)}>
                                      ${job.estimated_cost.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className={cn('truncate font-medium', colors.text)}>
                                  {job.title}
                                </div>
                                {job.client && (
                                  <div className={cn('text-xs', colors.text)}>
                                    {job.client.name}
                                  </div>
                                )}
                                <div className="text-[10px] opacity-70 mt-0.5">
                                  {assignedTo}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Time Block Dialog */}
      {showAddDialog && (
        <AddTimeBlockDialog
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open)
            if (!open) setEditingTimeBlock(null)
          }}
          onSubmit={handleAddTimeBlock}
          initialData={editingTimeBlock || undefined}
        />
      )}
    </div>
  )
}
