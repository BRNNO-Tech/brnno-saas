'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
// Using native select for now - can upgrade to shadcn Select component later
import { Checkbox } from '@/components/ui/checkbox'
import { Inbox, AlertTriangle, MessageSquare, CheckCircle, X, Ban } from 'lucide-react'

interface LeadsFiltersPanelProps {
  activeView: 'new' | 'at-risk' | 'engaged' | 'booked' | 'lost' | 'dnc'
  onViewChange: (view: 'new' | 'at-risk' | 'engaged' | 'booked' | 'lost' | 'dnc') => void
  filters: {
    status: string
    source: string
    service: string
    score: string
    lastTouch: string
    tags: string[]
  }
  onFiltersChange: (filters: any) => void
}

export function LeadsFiltersPanel({
  activeView,
  onViewChange,
  filters,
  onFiltersChange,
}: LeadsFiltersPanelProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Saved Views */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/35 mb-3">
          Saved Views
        </h3>
        <Tabs value={activeView} onValueChange={(v) => onViewChange(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-1 h-auto p-0 bg-transparent">
            <TabsTrigger
              value="new"
              className="justify-start data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <Inbox className="h-4 w-4 mr-2" />
              New
            </TabsTrigger>
            <TabsTrigger
              value="at-risk"
              className="justify-start data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              At-Risk
            </TabsTrigger>
            <TabsTrigger
              value="engaged"
              className="justify-start data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Engaged
            </TabsTrigger>
            <TabsTrigger
              value="booked"
              className="justify-start data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Booked
            </TabsTrigger>
            <TabsTrigger
              value="lost"
              className="justify-start data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4 mr-2" />
              Lost
            </TabsTrigger>
            <TabsTrigger
              value="dnc"
              className="justify-start data-[state=active]:bg-zinc-500/10 data-[state=active]:text-zinc-700 dark:data-[state=active]:text-zinc-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <Ban className="h-4 w-4 mr-2" />
              Do Not Contact
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Smart Filter Buttons */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/35 mb-3">
          Quick Filters
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start transition-all hover:bg-violet-500/10 hover:border-violet-500/30"
            onClick={() => updateFilter('status', 'needs-reply')}
          >
            Needs Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30"
            onClick={() => updateFilter('status', 'clicked-booking')}
          >
            Clicked Booking Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start transition-all hover:bg-amber-500/10 hover:border-amber-500/30"
            onClick={() => updateFilter('status', 'quote-no-response')}
          >
            Quote Sent, No Response
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start transition-all hover:bg-orange-500/10 hover:border-orange-500/30"
            onClick={() => updateFilter('status', 'missed-call')}
          >
            Missed Call
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/35">
          Filters
        </h3>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="quoted">Quoted</option>
              <option value="booked">Booked</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Source</Label>
            <select
              value={filters.source}
              onChange={(e) => updateFilter('source', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">All sources</option>
              <option value="facebook">Facebook</option>
              <option value="web">Web</option>
              <option value="call">Call</option>
              <option value="import">Import</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Score</Label>
            <select
              value={filters.score}
              onChange={(e) => updateFilter('score', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">All scores</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Last Touch</Label>
            <select
              value={filters.lastTouch}
              onChange={(e) => updateFilter('lastTouch', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="">Any time</option>
              <option value="today">Today</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(filters.status || filters.source || filters.service || filters.score || filters.lastTouch) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onFiltersChange({
            status: '',
            source: '',
            service: '',
            score: '',
            lastTouch: '',
            tags: [],
          })}
        >
          Clear Filters
        </Button>
      )}
    </div>
  )
}
