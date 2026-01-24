'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChannelConversionChartProps {
  data: Array<{
    channel: string
    sent: number
    replied: number
    booked: number
    revenue: number
  }>
}

export function ChannelConversionChart({ data }: ChannelConversionChartProps) {
  const chartData = data.map(d => ({
    channel: d.channel,
    Sent: d.sent,
    Replied: d.replied,
    Booked: d.booked,
  }))

  return (
    <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-sm">Conversion by Channel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-white/8" />
              <XAxis
                dataKey="channel"
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
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 16,
                  color: "rgb(24,24,27)",
                }}
              />
              <Legend />
              <Bar dataKey="Sent" fill="rgba(99,102,241,0.6)" />
              <Bar dataKey="Replied" fill="rgba(16,185,129,0.6)" />
              <Bar dataKey="Booked" fill="rgba(244,63,94,0.6)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
