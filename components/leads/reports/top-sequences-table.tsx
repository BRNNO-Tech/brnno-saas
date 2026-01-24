'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, CheckCircle, TrendingUp } from 'lucide-react'

interface SequenceROI {
  sequence_id: string
  sequence_name: string
  enrollments: number
  bookings: number
  revenue: number
  roi: number
}

interface TopSequencesTableProps {
  sequences: SequenceROI[]
}

export function TopSequencesTable({ sequences }: TopSequencesTableProps) {
  if (sequences.length === 0) {
    return (
      <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-sm">Top Sequences by ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">No sequence data yet</p>
            <p className="text-xs mt-1">Create and enable sequences to see ROI</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-sm">Top Sequences by ROI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sequences.map((seq, index) => (
            <div
              key={seq.sequence_id}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">
                    {seq.sequence_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600 dark:text-white/55">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {seq.enrollments}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {seq.bookings}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      ${seq.roi.toFixed(0)}/lead
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  ${seq.revenue.toFixed(0)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-white/55">
                  Revenue
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
