'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getReports } from '@/lib/actions/reports'
import { DollarSign, Briefcase, Users, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import UpgradePrompt from '@/components/upgrade-prompt'

export default function ReportsPage() {
  const { can, loading: featureLoading } = useFeatureGate()
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!can('reports')) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const reports = await getReports(timeframe)
        if (reports) {
          setData(reports)
        } else {
          console.error('No reports data returned')
          setData(null)
        }
      } catch (error) {
        console.error('Error loading reports:', error)
        setData(null)
        // Don't show alert, just log the error - the UI will show loading state
      } finally {
        setLoading(false)
      }
    }
    if (!featureLoading) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, featureLoading])

  if (featureLoading) {
    return (
      <div className="p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    )
  }

  if (!can('reports')) {
    return <UpgradePrompt requiredTier="pro" feature="Reports & Analytics" />
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Loading reports...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
            Unable to load reports
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300">
            There was an error loading the reports data. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
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
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Revenue Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-600/10 dark:from-green-600/20 via-green-500/5 dark:via-green-500/10 to-emerald-500/10 dark:to-emerald-500/20 border-green-500/20 dark:border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  ${(data.revenue?.total || 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-600/10 dark:from-orange-600/20 via-orange-500/5 dark:via-orange-500/10 to-red-500/10 dark:to-red-500/20 border-orange-500/20 dark:border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  ${(data.revenue?.outstanding || 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600/10 dark:from-blue-600/20 via-blue-500/5 dark:via-blue-500/10 to-cyan-500/10 dark:to-cyan-500/20 border-blue-500/20 dark:border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {(data.revenue?.collectionRate || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Job Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-purple-600/10 dark:from-purple-600/20 via-purple-500/5 dark:via-purple-500/10 to-pink-500/10 dark:to-pink-500/20 border-purple-500/20 dark:border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{data.jobs?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600/10 dark:from-green-600/20 via-green-500/5 dark:via-green-500/10 to-emerald-500/10 dark:to-emerald-500/20 border-green-500/20 dark:border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{data.jobs?.completed || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600/10 dark:from-blue-600/20 via-blue-500/5 dark:via-blue-500/10 to-cyan-500/10 dark:to-cyan-500/20 border-blue-500/20 dark:border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{(data.jobs?.completionRate || 0).toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-600/10 dark:from-amber-600/20 via-amber-500/5 dark:via-amber-500/10 to-yellow-500/10 dark:to-yellow-500/20 border-amber-500/20 dark:border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Avg Job Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">${(data.jobs?.avgCost || 0).toFixed(2)}</div>
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
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs?.byStatus?.scheduled || 0}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-blue-600 rounded-full" 
                  style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.scheduled || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs?.byStatus?.in_progress || 0}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-orange-600 rounded-full" 
                  style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.in_progress || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs?.byStatus?.completed || 0}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-green-600 rounded-full" 
                  style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.completed || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cancelled</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{data.jobs?.byStatus?.cancelled || 0}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
                <div 
                  className="h-2 bg-red-600 rounded-full" 
                  style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.cancelled || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Efficiency Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Avg Job Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {(data.jobs?.avgDuration || 0) % 60 === 0
                  ? `${((data.jobs?.avgDuration || 0) / 60).toFixed(0)} ${(data.jobs?.avgDuration || 0) / 60 === 1 ? 'hr' : 'hrs'}`
                  : `${((data.jobs?.avgDuration || 0) / 60).toFixed(1)} hrs`}
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
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">${(data.jobs?.totalEstimatedValue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Avg Job Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">${(data.jobs?.avgCost || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Client Analytics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-600/10 dark:from-blue-600/20 via-blue-500/5 dark:via-blue-500/10 to-cyan-500/10 dark:to-cyan-500/20 border-blue-500/20 dark:border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{data.clients?.new || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600/10 dark:from-green-600/20 via-green-500/5 dark:via-green-500/10 to-emerald-500/10 dark:to-emerald-500/20 border-green-500/20 dark:border-green-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Repeat Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{data.clients?.repeat || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-600/10 dark:from-purple-600/20 via-purple-500/5 dark:via-purple-500/10 to-pink-500/10 dark:to-pink-500/20 border-purple-500/20 dark:border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{data.clients?.total || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Key Insights</h2>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {(data.insights || []).map((insight: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />}
                {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{insight.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

