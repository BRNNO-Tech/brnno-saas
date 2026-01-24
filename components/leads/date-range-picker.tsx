'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: string
  onChange: (range: string) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Only render Popover on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleApply = () => {
    if (fromDate && toDate) {
      onChange(`custom:${fromDate}:${toDate}`)
      setOpen(false)
    }
  }

  const handleClear = () => {
    setFromDate('')
    setToDate('')
    onChange('30d') // Reset to default
    setOpen(false)
  }

  // Parse current value if it's a custom range
  const isCustom = value.startsWith('custom:')
  const customDates = isCustom ? value.split(':') : []

  // Render button only on server, full Popover on client
  if (!mounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors",
          isCustom
            ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
            : "text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10"
        )}
        disabled
      >
        <CalendarIcon className="h-3 w-3 mr-1" />
        Custom
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors",
            isCustom
              ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
              : "text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10"
          )}
        >
          <CalendarIcon className="h-3 w-3 mr-1" />
          Custom
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label htmlFor="from-date" className="text-xs">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate || customDates[1] || ''}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="to-date" className="text-xs">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate || customDates[2] || ''}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!fromDate || !toDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
