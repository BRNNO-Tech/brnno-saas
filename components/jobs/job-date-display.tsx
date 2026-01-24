'use client'

import { formatJobDate } from '@/lib/utils/date-format'
import { Calendar } from 'lucide-react'

export function JobDateDisplay({ scheduledDate }: { scheduledDate: string | null }) {
  if (!scheduledDate) return <span>Not scheduled</span>
  
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      <span className="text-sm font-medium text-zinc-900 dark:text-white">
        {formatJobDate(scheduledDate)}
      </span>
    </div>
  )
}
