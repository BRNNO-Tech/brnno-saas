'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getReports } from '@/lib/actions/reports'
import { DollarSign, Briefcase, Users, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const reports = await getReports(timeframe)
        setData(reports)
      } catch (error) {
        console.error('Error loading reports:', error)
        alert('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [timeframe])

  if (loading || !data) {
    return (
      <div className="p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-zinc-400">
            Track your business performance
          </p>
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

      {/* Revenue Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Revenue Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-emerald-500/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  ${data.revenue.total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-red-500/20 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  ${data.revenue.outstanding.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {data.revenue.collectionRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Job Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-pink-500/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.jobs.total}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-emerald-500/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.jobs.completed}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.jobs.completionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-600/20 via-amber-500/10 to-yellow-500/20 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Avg Job Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${data.jobs.avgCost.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Job Status Breakdown */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Scheduled</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs.byStatus.scheduled}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-blue-600 rounded-full" 
                  style={{ width: `${data.jobs.total > 0 ? (data.jobs.byStatus.scheduled / data.jobs.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs.byStatus.in_progress}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-orange-600 rounded-full" 
                  style={{ width: `${data.jobs.total > 0 ? (data.jobs.byStatus.in_progress / data.jobs.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs.byStatus.completed}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-green-600 rounded-full" 
                  style={{ width: `${data.jobs.total > 0 ? (data.jobs.byStatus.completed / data.jobs.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cancelled</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs.byStatus.cancelled}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-red-600 rounded-full" 
                  style={{ width: `${data.jobs.total > 0 ? (data.jobs.byStatus.cancelled / data.jobs.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Efficiency Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Avg Job Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.jobs.avgDuration % 60 === 0
                  ? `${(data.jobs.avgDuration / 60).toFixed(0)} ${data.jobs.avgDuration / 60 === 1 ? 'hr' : 'hrs'}`
                  : `${(data.jobs.avgDuration / 60).toFixed(1)} hrs`}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Estimated Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.jobs.totalEstimatedValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Avg Job Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.jobs.avgCost.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Client Analytics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                New Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{data.clients.new}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-emerald-500/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Repeat Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{data.clients.repeat}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-pink-500/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{data.clients.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {data.insights.map((insight: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />}
                {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

