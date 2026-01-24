"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type RevenueData = {
  name: string
  total: number
}

// Custom tooltip component for better visibility
function CustomTooltip(props: any) {
  const { active, payload, label } = props
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white dark:bg-zinc-800 shadow-lg p-3">
        <p className="font-semibold text-sm mb-1">{label}</p>
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          ${(payload[0]?.value as number)?.toFixed(2) || '0.00'}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const hasData = data.length > 0 && data.some(d => d.total > 0)
  
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {!hasData ? (
          <div className="h-[350px] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">No revenue data yet. Start booking jobs to see your revenue trends!</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-zinc-600 dark:text-zinc-400"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-zinc-600 dark:text-zinc-400"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-blue-600 dark:fill-blue-400"
              />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

