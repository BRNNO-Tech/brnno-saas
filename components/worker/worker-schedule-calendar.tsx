'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Navigation } from 'lucide-react'
import { getWorkerScheduledJobs } from '@/lib/actions/worker-schedule'
import Link from 'next/link'

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
  const [jobs, setJobs] = useState<Job[]>(initialJobs)

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

  // Reload data when month changes
  useEffect(() => {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    async function loadData() {
      try {
        const newJobs = await getWorkerScheduledJobs(
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        )
        setJobs(newJobs)
      } catch (error) {
        console.error('Error loading schedule data:', error)
      }
    }

    loadData()
  }, [year, month])

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

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
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
    </div>
  )
}

