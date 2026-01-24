'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getLeadAnalytics } from '@/lib/actions/lead-analytics'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  MessageSquare,
  Users,
  Award,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

export default function LeadAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const analytics = await getLeadAnalytics(timeframe)
      setData(analytics)
      setLoading(false)
    }
    loadData()
  }, [timeframe])

  if (loading || !data) {
    return (
      <div className="p-6">
        <p>Loading analytics...</p>
      </div>
    )
  }

  const {
    overview,
    sourceBreakdown,
    serviceBreakdown,
    scoreDistribution,
    statusBreakdown,
  } = data

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Lead Analytics</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track lead performance and ROI
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={timeframe === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeframe('week')}
          >
            Week
          </Button>
          <Button
            variant={timeframe === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeframe('month')}
          >
            Month
          </Button>
          <Button
            variant={timeframe === 'quarter' ? 'default' : 'outline'}
            onClick={() => setTimeframe('quarter')}
          >
            Quarter
          </Button>
          <Button
            variant={timeframe === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeframe('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Leads
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalLeads}</div>
            {overview.trend !== 0 && (
              <div
                className={`mt-1 flex items-center gap-1 text-sm ${overview.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {overview.trend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(overview.trend).toFixed(1)}% vs last period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Conversion Rate
            </CardTitle>
            <Target className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview.conversionRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {overview.convertedLeads} booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Revenue Recovered
            </CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              ${overview.revenueRecovered.toFixed(2)}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              From booked leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Avg Time to Convert
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview.avgTimeToConvert.toFixed(1)}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Response Rate
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview.responseRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Leads with interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                Hot Leads
              </span>
              <span className="font-semibold">{scoreDistribution.hot}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                Warm Leads
              </span>
              <span className="font-semibold">{scoreDistribution.warm}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                Cold Leads
              </span>
              <span className="font-semibold">{scoreDistribution.cold}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Source</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceBreakdown.length === 0 ? (
            <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
              No source data yet. Add leads with sources to see breakdown.
            </p>
          ) : (
            <div className="space-y-4">
              {sourceBreakdown.map((source: any) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium capitalize">{source.source}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {source.converted}/{source.total} booked • $
                          {source.revenue.toFixed(2)} revenue
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {source.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${source.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Performing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Services</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceBreakdown.length === 0 ? (
            <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
              No service data yet. Leads need to select services.
            </p>
          ) : (
            <div className="space-y-4">
              {serviceBreakdown.map((service: any, index: number) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {service.converted}/{service.total} booked (
                        {service.rate.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${service.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">New</p>
            <p className="text-2xl font-bold">{statusBreakdown.new}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              In Progress
            </p>
            <p className="text-2xl font-bold">{statusBreakdown.in_progress}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Quoted</p>
            <p className="text-2xl font-bold">{statusBreakdown.quoted}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Booked
            </p>
            <p className="text-2xl font-bold text-green-600">
              {statusBreakdown.booked}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Lost</p>
            <p className="text-2xl font-bold text-red-600">
              {statusBreakdown.lost}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
