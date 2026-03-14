'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Navigation } from 'lucide-react'
import { getWorkerScheduledJobs } from '@/lib/actions/worker-schedule'
import Link from 'next/link'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type Job = {
  id: string
  title: string
  scheduled_date: string | null
  estimated_duration: number | null
  estimated_cost: number | null
  status: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  client: { name: string; phone: string | null; email: string | null } | null
}

export default function WorkerScheduleCalendar({
  initialJobs
}: {
  initialJobs: Job[]
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [now, setNow] = useState(() => new Date())

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

  function isSameLocalDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  // Get jobs for a specific date
  function getJobsForDate(date: Date | null): Job[] {
    if (!date) return []

    const dateStr = date.toISOString().split('T')[0]

    return jobs.filter(job => {
      if (!job.scheduled_date) return false
      const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
      return jobDate === dateStr
    })
  }

  // Format time from datetime string
  function formatTime(datetime: string): string {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get full address
  function getFullAddress(job: Job): string | null {
    if (job.address) {
      return `${job.address}, ${job.city || ''} ${job.state || ''} ${job.zip || ''}`.replace(/,\s*$/, '').trim()
    }
    return null
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

  function goToPreviousDay() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  function goToNextDay() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  function goToPreviousWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  function goToNextWeek() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  // Reload data when view or date changes
  useEffect(() => {
    let startDate: Date
    let endDate: Date

    if (view === 'day') {
      startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      const dayOfWeek = currentDate.getDay()
      startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else {
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0, 23, 59, 59)
    }

    async function loadData() {
      try {
        const newJobs = await getWorkerScheduledJobs(
          startDate.toISOString(),
          endDate.toISOString()
        )
        setJobs(newJobs)
      } catch (error) {
        console.error('Error loading schedule data:', error)
      }
    }

    loadData()
  }, [view, currentDate, year, month])

  // Update "now" every minute for current time indicator
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const hourlySlots = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  const HOUR_HEIGHT = 80
  const START_HOUR = 6
  const END_HOUR = 22
  const getNowLineTop = () => {
    const h = now.getHours()
    const m = now.getMinutes()
    if (h < START_HOUR) return 0
    if (h > END_HOUR || (h === END_HOUR && m > 0)) return (END_HOUR - START_HOUR) * HOUR_HEIGHT
    const minutesFromStart = (h - START_HOUR) * 60 + m
    return Math.min(minutesFromStart * (HOUR_HEIGHT / 60), (END_HOUR - START_HOUR) * HOUR_HEIGHT)
  }
  const showNowLineDay = view === 'day' && isSameLocalDate(currentDate, now)
  const showNowLineWeek =
    view === 'week' &&
    (() => {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      return today >= weekStart && today <= weekEnd
    })()

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={view === 'day' ? goToPreviousDay : view === 'week' ? goToPreviousWeek : goToPreviousMonth}
            className="h-8 w-8 flex items-center justify-center border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Button variant="outline" size="sm" onClick={goToToday} className="rounded-none border-zinc-300 dark:border-zinc-600">
            Today
          </Button>
          <button
            onClick={view === 'day' ? goToNextDay : view === 'week' ? goToNextWeek : goToNextMonth}
            className="h-8 w-8 flex items-center justify-center border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50 ml-1">
            {view === 'day'
              ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : view === 'week'
                ? `Week of ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                : `${monthNames[month]} ${year}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Day/Week/Month toggle — boxy, amber active */}
          <div className="flex gap-px border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-none px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors',
                  view === v
                    ? 'bg-amber-500 text-amber-950'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="overflow-x-auto -mx-1">
        <div className="flex gap-px min-w-max px-1 py-2">
          {(() => {
            const center = new Date(currentDate)
            center.setHours(0, 0, 0, 0)
            const stripDays: Date[] = []
            for (let i = -3; i <= 3; i++) {
              const d = new Date(center)
              d.setDate(center.getDate() + i)
              stripDays.push(d)
            }
            const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
            return stripDays.map((d) => {
              const isTodayDate = isToday(d)
              const isSelected = view === 'day' && isSameLocalDate(currentDate, d)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    setCurrentDate(new Date(d))
                    setView('day')
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[44px] w-11 py-2 rounded-none border border-zinc-300 dark:border-zinc-600 transition-colors',
                    isTodayDate && 'bg-amber-50 dark:bg-amber-950/20 border-amber-500',
                    !isTodayDate && isSelected && 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100',
                    !isTodayDate && !isSelected && 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {dayLetters[d.getDay()]}
                  </span>
                  <span
                    className={cn(
                      'text-base font-bold mt-0.5',
                      isTodayDate
                        ? 'flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-semibold'
                        : 'text-zinc-900 dark:text-zinc-100'
                    )}
                  >
                    {d.getDate()}
                  </span>
                </button>
              )
            })
          })()}
        </div>
      </div>

      {/* Day view */}
      {view === 'day' && (
        <Card>
          <CardContent className="p-0">
            <div className="relative max-h-[600px] overflow-y-auto">
              {showNowLineDay && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-amber-500 z-20 pointer-events-none"
                  style={{ top: getNowLineTop() }}
                />
              )}
              {hourlySlots.map((hour) => {
                const hourStart = new Date(currentDate)
                hourStart.setHours(hour, 0, 0, 0)
                const hourEnd = new Date(currentDate)
                hourEnd.setHours(hour, 59, 59, 999)
                const dayJobs = jobs.filter((job) => {
                  if (!job.scheduled_date) return false
                  const jobDate = new Date(job.scheduled_date)
                  if (!isSameLocalDate(jobDate, currentDate)) return false
                  const jobHour = jobDate.getHours()
                  const jobMin = jobDate.getMinutes()
                  const duration = job.estimated_duration ?? 60
                  const endMin = jobMin + duration
                  const jobEndHour = jobHour + Math.floor(endMin / 60)
                  const jobEndMin = endMin % 60
                  return jobHour < hour + 1 && (jobEndHour > hour || (jobEndHour === hour && jobEndMin > 0))
                })
                return (
                  <div key={hour} className="flex border-b border-zinc-200 dark:border-zinc-800 min-h-[80px]">
                    <div className="w-16 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                    <div className="flex-1 p-2 relative">
                      {dayJobs.map((job) => {
                        const fullAddress = getFullAddress(job)
                        const mapsUrl = fullAddress
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                          : null
                        return (
                          <Link
                            key={job.id}
                            href={`/worker/jobs/${job.id}`}
                            className="block rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-2 py-1.5 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mb-1"
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-blue-800 dark:text-blue-200">
                                {job.scheduled_date ? formatTime(job.scheduled_date) : ''}
                              </span>
                            </div>
                            <div className="truncate font-medium text-blue-900 dark:text-blue-100">{job.title}</div>
                            {job.client && (
                              <div className="text-[10px] text-blue-700 dark:text-blue-300 truncate">{job.client.name}</div>
                            )}
                            {mapsUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  window.open(mapsUrl, '_blank', 'noopener,noreferrer')
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Navigation className="h-3 w-3" />
                                Directions
                              </button>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week view */}
      {view === 'week' && (
        <Card>
          <CardContent className="p-0">
            <div className="relative max-h-[600px] overflow-y-auto">
              {showNowLineWeek && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-amber-500 z-20 pointer-events-none"
                  style={{ top: getNowLineTop() }}
                />
              )}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-16 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Time
                </div>
                {(() => {
                  const weekStart = new Date(currentDate)
                  weekStart.setDate(currentDate.getDate() - currentDate.getDay())
                  const weekDays: Date[] = []
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(weekStart)
                    d.setDate(weekStart.getDate() + i)
                    weekDays.push(d)
                  }
                  return weekDays.map((day, idx) => {
                    const dayIsToday = isToday(day)
                    return (
                      <div
                        key={idx}
                        className="flex-1 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-2 text-center bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{dayNames[day.getDay()]}</div>
                        <div className={cn('text-sm font-bold', dayIsToday && 'text-amber-600 dark:text-amber-400')}>{day.getDate()}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{monthNames[day.getMonth()].slice(0, 3)}</div>
                      </div>
                    )
                  })
                })()}
              </div>
              {hourlySlots.map((hour) => {
                const weekStart = new Date(currentDate)
                weekStart.setDate(currentDate.getDate() - currentDate.getDay())
                const weekDays: Date[] = []
                for (let i = 0; i < 7; i++) {
                  const d = new Date(weekStart)
                  d.setDate(weekStart.getDate() + i)
                  weekDays.push(d)
                }
                return (
                  <div key={hour} className="flex border-b border-zinc-200 dark:border-zinc-800 min-h-[80px]">
                    <div className="w-16 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const dayStart = new Date(day)
                      dayStart.setHours(hour, 0, 0, 0)
                      const dayEnd = new Date(day)
                      dayEnd.setHours(hour, 59, 59, 999)
                      const cellJobs = jobs.filter((job) => {
                        if (!job.scheduled_date) return false
                        const jobDate = new Date(job.scheduled_date)
                        if (!isSameLocalDate(jobDate, day)) return false
                        const jobHour = jobDate.getHours()
                        const jobMin = jobDate.getMinutes()
                        const duration = job.estimated_duration ?? 60
                        const endMin = jobMin + duration
                        const jobEndHour = jobHour + Math.floor(endMin / 60)
                        const jobEndMin = endMin % 60
                        return jobHour < hour + 1 && (jobEndHour > hour || (jobEndHour === hour && jobEndMin > 0))
                      })
                      return (
                        <div
                          key={dayIdx}
                          className="flex-1 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-1"
                        >
                          {cellJobs.map((job) => {
                            const fullAddress = getFullAddress(job)
                            const mapsUrl = fullAddress
                              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                              : null
                            const jobDate = job.scheduled_date ? new Date(job.scheduled_date) : null
                            const showTime = jobDate && jobDate.getHours() === hour
                            return (
                              <Link
                                key={job.id}
                                href={`/worker/jobs/${job.id}`}
                                className="block rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-1.5 py-1 text-[10px] hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mb-0.5"
                              >
                                {showTime && (
                                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                                    {formatTime(job.scheduled_date!)}
                                  </span>
                                )}
                                <div className="truncate font-medium text-blue-900 dark:text-blue-100">{job.title}</div>
                                {job.client && (
                                  <div className="truncate text-[9px] text-blue-700 dark:text-blue-300">{job.client.name}</div>
                                )}
                                {mapsUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      window.open(mapsUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    <Navigation className="h-2.5 w-2.5" />
                                    Directions
                                  </button>
                                )}
                              </Link>
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

      {/* Month view — existing calendar grid */}
      {view === 'month' && (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {dayNames.map(day => (
              <div
                key={day}
                className="border-r p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayJobs = getJobsForDate(date)
              const isCurrentMonth = date !== null
              const isCurrentDay = date && isToday(date)

              return (
                <div
                  key={index}
                  className={`min-h-[100px] sm:min-h-[120px] border-r border-b p-1 sm:p-2 last:border-r-0 ${
                    !isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-950' : ''
                  }`}
                >
                  {date && (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            isCurrentDay
                              ? 'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                              : 'text-zinc-900 dark:text-zinc-50'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayJobs.map(job => {
                          const fullAddress = getFullAddress(job)
                          const mapsUrl = fullAddress
                            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                            : null

                          return (
                            <Link
                              key={job.id}
                              href={`/worker/jobs/${job.id}`}
                              className="block rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-1.5 sm:px-2 py-1 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <span className="text-blue-800 dark:text-blue-200 truncate">
                                  {job.scheduled_date ? formatTime(job.scheduled_date) : ''}
                                </span>
                              </div>
                              <div className="truncate font-medium text-blue-900 dark:text-blue-100 mt-0.5">
                                {job.title}
                              </div>
                              {job.client && (
                                <div className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 truncate">
                                  {job.client.name}
                                </div>
                              )}
                              {mapsUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
                                  }}
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <Navigation className="h-3 w-3" />
                                  Directions
                                </button>
                              )}
                            </Link>
                          )
                        })}
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
    </div>
  )
}

