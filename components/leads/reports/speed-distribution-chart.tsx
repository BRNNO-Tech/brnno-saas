'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SpeedDistributionChartProps {
  data: Array<{ range: string; count: number }>
}

export function SpeedDistributionChart({ data }: SpeedDistributionChartProps) {
  return (
    <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-sm">Speed-to-Lead Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-white/8" />
              <XAxis
                type="number"
                tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                className="dark:[&_text]:fill-white/55"
                axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
              />
              <YAxis
                type="category"
                dataKey="range"
                tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                className="dark:[&_text]:fill-white/55"
                axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 16,
                  color: "rgb(24,24,27)",
                }}
              />
              <Bar dataKey="count" fill="rgba(99,102,241,0.6)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
