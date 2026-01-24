'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format dates for display
  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-sm">Recovered Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-white/8" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                className="dark:[&_text]:fill-white/55"
                axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
              />
              <YAxis
                tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                className="dark:[&_text]:fill-white/55"
                axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 16,
                  color: "rgb(24,24,27)",
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="rgba(99,102,241,0.8)"
                strokeWidth={2}
                dot={{ fill: "rgba(99,102,241,0.8)", r: 4 }}
                className="dark:stroke-violet-400"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
