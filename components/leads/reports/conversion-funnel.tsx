'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FunnelData {
  stage: string
  count: number
  percentage: number
}

interface ConversionFunnelProps {
  data: FunnelData[]
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-sm">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, index) => {
            const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            const isFirst = index === 0
            const isLast = index === data.length - 1

            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-white/55 font-medium">
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 dark:text-white font-semibold">
                      {stage.count}
                    </span>
                    <span className="text-zinc-500 dark:text-white/45">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="relative h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-lg transition-all duration-500',
                      isFirst && 'bg-violet-500',
                      !isFirst && !isLast && 'bg-cyan-500',
                      isLast && 'bg-emerald-500'
                    )}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
