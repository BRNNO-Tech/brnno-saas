'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react'
import { getScheduledJobs, getTimeBlocks, createTimeBlock, deleteTimeBlock, updateJobDate } from '@/lib/actions/schedule'
import AddTimeBlockDialog from './add-time-block-dialog'

type Job = {
  id: string
  title: string
  scheduled_date: string | null
  estimated_duration: number | null
  estimated_cost: number | null
  status: string
  client: { name: string } | null
}

type TimeBlock = {
  id: string
  title: string
  start_time: string
  end_time: string
  type: 'personal' | 'holiday' | 'unavailable'
  description: string | null
}

export default function ScheduleCalendar({
  initialJobs,
  initialTimeBlocks
}: {
  initialJobs: Job[]
  initialTimeBlocks: TimeBlock[]
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)

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

  // Get events for a specific date
  function getEventsForDate(date: Date | null): { jobs: Job[]; timeBlocks: TimeBlock[] } {
    if (!date) return { jobs: [], timeBlocks: [] }

    const dateStr = date.toISOString().split('T')[0]

    const dayJobs = jobs.filter(job => {
      if (!job.scheduled_date) return false
      const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
      return jobDate === dateStr
    })

    const dayTimeBlocks = timeBlocks.filter(block => {
      const blockStart = new Date(block.start_time).toISOString().split('T')[0]
      const blockEnd = new Date(block.end_time).toISOString().split('T')[0]
      return dateStr >= blockStart && dateStr <= blockEnd
    })

    return { jobs: dayJobs, timeBlocks: dayTimeBlocks }
  }

  // Format time from datetime string
  // The datetime comes from the database as an ISO string (UTC)
  // We need to display it in the user's local timezone
  function formatTime(datetime: string): string {
    if (!datetime) return ''
    
    try {
      const date = new Date(datetime)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', datetime)
        return ''
      }
      
      // Format in user's local timezone (toLocaleTimeString uses local timezone by default)
      return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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
        const [newJobs, newTimeBlocks] = await Promise.all([
          getScheduledJobs(startDate.toISOString(), endDate.toISOString()),
          getTimeBlocks(startDate.toISOString(), endDate.toISOString())
        ])
        setJobs(newJobs)
        setTimeBlocks(newTimeBlocks)
      } catch (error) {
        console.error('Error loading schedule data:', error)
      }
    }

    loadData()
  }, [year, month, view, currentDate])

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
      const newBlock = await createTimeBlock(data)
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

  // Handle drag and drop for jobs
  function handleDragStart(e: React.DragEvent, job: Job) {
    setDraggedJob(job)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e: React.DragEvent, targetDate: Date | null) {
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

      // Update local state
      setJobs(jobs.map(job =>
        job.id === draggedJob.id
          ? { ...job, scheduled_date: newDateTime.toISOString() }
          : job
      ))
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

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
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
                <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : view === 'week' ? (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(newDate.getDate() - 7)
                  setCurrentDate(newDate)
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setDate(newDate.getDate() + 7)
                  setCurrentDate(newDate)
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white dark:bg-zinc-900 p-1">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
            >
              Daily
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
            >
              Weekly
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              Monthly
            </Button>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Block Time
          </Button>
        </div>
      </div>

      {/* Daily View */}
      {view === 'day' && (
        <Card>
          <CardContent className="p-0">
            <div className="flex">
              {/* Time Column */}
              <div className="w-20 border-r p-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Time</div>
              </div>
              {/* Timeline Column */}
              <div className="flex-1">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 p-2 border-b">
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
                            className={`absolute left-0 right-0 rounded px-2 py-1 text-xs ${
                              block.type === 'personal'
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

                        return (
                          <div
                            key={job.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, job)}
                            className="absolute left-0 right-0 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-2 py-1 text-xs cursor-move hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors z-10"
                            style={{
                              top: `${topOffset}%`,
                              height: `${height}%`,
                              minHeight: '30px',
                            }}
                          >
                            {jobHour === hour && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                                    {formatTime(job.scheduled_date)}
                                  </span>
                                  {job.estimated_cost && (
                                    <span className="ml-auto font-semibold text-blue-800 dark:text-blue-200">
                                      ${job.estimated_cost.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className="truncate font-medium text-blue-900 dark:text-blue-100">
                                  {job.title}
                                </div>
                                {job.client && (
                                  <div className="text-xs text-blue-700 dark:text-blue-300">
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
          </CardContent>
        </Card>
      )}

      {/* Weekly View */}
      {view === 'week' && (
        <Card>
          <CardContent className="p-0">
            {/* Week Header */}
            <div className="flex border-b">
              <div className="w-20 border-r p-2 flex-shrink-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Time</div>
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
                      className="flex-1 border-r last:border-r-0 p-2 text-center"
                    >
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        {dayNames[day.getDay()]}
                      </div>
                      <div className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                        {day.getDate()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
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

                      // Get jobs that overlap with this day and hour
                      const dayJobs = jobs.filter(job => {
                        if (!job.scheduled_date) return false
                        const jobDate = new Date(job.scheduled_date)
                        const jobDateStr = jobDate.toISOString().split('T')[0]
                        const dayStr = day.toISOString().split('T')[0]
                        if (jobDateStr !== dayStr) return false
                        
                        const jobHour = jobDate.getHours()
                        const jobDuration = job.estimated_duration || 60
                        const jobEndHour = jobHour + Math.floor(jobDuration / 60)
                        
                        // Check if job overlaps with this hour
                        return jobHour <= hour && jobEndHour >= hour
                      })

                      // Get time blocks for this day and hour
                      const dayTimeBlocks = timeBlocks.filter(block => {
                        const blockStart = new Date(block.start_time)
                        const blockEnd = new Date(block.end_time)
                        const blockDateStr = blockStart.toISOString().split('T')[0]
                        const dayStr = day.toISOString().split('T')[0]
                        return blockDateStr === dayStr && (blockStart < dayEnd && blockEnd > dayStart)
                      })

                      return (
                        <div
                          key={dayIndex}
                          className="flex-1 border-r last:border-r-0 relative p-1"
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
                                className={`absolute left-0 right-0 rounded px-1 py-0.5 text-xs ${
                                  block.type === 'personal'
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
                            const jobDateStr = jobDate.toISOString().split('T')[0]
                            const dayStr = day.toISOString().split('T')[0]
                            if (jobDateStr !== dayStr) return null
                            
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

                            return (
                              <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job)}
                                className="absolute left-0 right-0 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-1 py-0.5 text-xs cursor-move hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors z-10"
                                style={{
                                  top: `${topOffset}%`,
                                  height: `${height}%`,
                                  minHeight: '25px',
                                }}
                              >
                                {jobHour === hour && (
                                  <>
                                    <div className="text-[10px] font-medium text-blue-900 dark:text-blue-100 truncate">
                                      {formatTime(job.scheduled_date)}
                                    </div>
                                    <div className="text-[10px] text-blue-800 dark:text-blue-200 truncate">
                                      {job.title}
                                    </div>
                                    {job.estimated_cost && (
                                      <div className="text-[9px] text-blue-700 dark:text-blue-300">
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
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      {view === 'month' && (
        <Card>
          <CardContent className="p-0">
            <div className="grid border-b" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', display: 'grid' }}>
              {dayNames.map((day, idx) => (
                <div
                  key={`header-${day}-${idx}`}
                  className="border-r p-3 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 last:border-r-0"
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
                    className={`min-h-[120px] border-r border-b p-2 last:border-r-0 ${!isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-950' : ''
                      } ${draggedJob ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    style={{ minWidth: 0 }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                  >
                    {date && (
                      <>
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${isCurrentDay
                              ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                              : 'text-zinc-900 dark:text-zinc-50'
                              }`}
                          >
                            {date.getDate()}
                          </span>
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
                                <button
                                  onClick={() => handleDeleteTimeBlock(block.id)}
                                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 group-hover:flex"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </button>
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
                          {events.jobs.map(job => (
                            <div
                              key={job.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, job)}
                              className="cursor-move rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-2 py-1 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-800 dark:text-blue-200">
                                  {job.scheduled_date ? formatTime(job.scheduled_date) : ''}
                                </span>
                                {job.estimated_cost && (
                                  <span className="ml-auto font-semibold text-blue-800 dark:text-blue-200">
                                    ${job.estimated_cost.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="truncate font-medium text-blue-900 dark:text-blue-100">
                                {job.title}
                              </div>
                              {job.client && (
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                  {job.client.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Time Block Dialog */}
      {showAddDialog && (
        <AddTimeBlockDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleAddTimeBlock}
        />
      )}
    </div>
  )
}
