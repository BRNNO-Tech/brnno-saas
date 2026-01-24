'use client'

import { useState, useEffect } from 'react'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'
import { getReports } from '@/lib/actions/reports'
import { DollarSign, Briefcase, Users, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import UpgradePrompt from '@/components/upgrade-prompt'
import Link from 'next/link'

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <p className="text-sm text-zinc-600 dark:text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  if (!can('reports')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <UpgradePrompt requiredTier="pro" feature="Reports & Analytics" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <p className="text-sm text-zinc-600 dark:text-white/50">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="rounded-2xl border border-rose-500/30 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 backdrop-blur-sm p-6 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-300 mb-2">
              Unable to load reports
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-400">
              There was an error loading the reports data. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Reports & Analytics</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Track your business performance
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setTimeframe('week')}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm transition-colors",
                  timeframe === 'week'
                    ? "border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                    : "border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm transition-colors",
                  timeframe === 'month'
                    ? "border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                    : "border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setTimeframe('quarter')}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm transition-colors",
                  timeframe === 'quarter'
                    ? "border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                    : "border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
                )}
              >
                Quarter
              </button>
              <button
                onClick={() => setTimeframe('year')}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm transition-colors",
                  timeframe === 'year'
                    ? "border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200"
                    : "border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10"
                )}
              >
                Year
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Revenue Overview */}
            <CardShell title="Revenue Overview" subtitle={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} performance`}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <DollarSign className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Total Revenue</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {currency(data.revenue?.total || 0)}
                  </p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <DollarSign className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Outstanding</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {currency(data.revenue?.outstanding || 0)}
                  </p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-cyan-500/20 dark:ring-cyan-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-100/50 dark:bg-cyan-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <TrendingUp className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Collection Rate</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {(data.revenue?.collectionRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardShell>

            {/* Job Performance */}
            <CardShell title="Job Performance" subtitle="Completion and efficiency metrics">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 dark:border-violet-500/30 bg-gradient-to-br from-violet-500/18 dark:from-violet-500/18 to-violet-500/5 dark:to-violet-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-violet-500/20 dark:ring-violet-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-100/50 dark:bg-violet-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <Briefcase className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Total Jobs</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{data.jobs?.total || 0}</p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <CheckCircle className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Completed</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{data.jobs?.completed || 0}</p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-cyan-500/20 dark:ring-cyan-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-100/50 dark:bg-cyan-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <TrendingUp className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Completion Rate</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{(data.jobs?.completionRate || 0).toFixed(1)}%</p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <DollarSign className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Avg Job Cost</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{currency(data.jobs?.avgCost || 0)}</p>
                </div>
              </div>
              
              {/* Job Status Breakdown */}
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Status Breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-700 dark:text-white/70">Scheduled</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{data.jobs?.byStatus?.scheduled || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200/50 dark:bg-white/10">
                      <div 
                        className="h-2 rounded-full bg-cyan-500/70 dark:bg-cyan-500/70" 
                        style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.scheduled || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-700 dark:text-white/70">In Progress</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{data.jobs?.byStatus?.in_progress || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200/50 dark:bg-white/10">
                      <div 
                        className="h-2 rounded-full bg-amber-500/70 dark:bg-amber-500/70" 
                        style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.in_progress || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-700 dark:text-white/70">Completed</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{data.jobs?.byStatus?.completed || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200/50 dark:bg-white/10">
                      <div 
                        className="h-2 rounded-full bg-emerald-500/70 dark:bg-emerald-500/70" 
                        style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.completed || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-700 dark:text-white/70">Cancelled</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{data.jobs?.byStatus?.cancelled || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200/50 dark:bg-white/10">
                      <div 
                        className="h-2 rounded-full bg-rose-500/70 dark:bg-rose-500/70" 
                        style={{ width: `${(data.jobs?.total || 0) > 0 ? ((data.jobs?.byStatus?.cancelled || 0) / (data.jobs?.total || 1)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardShell>

            {/* Efficiency Metrics */}
            <CardShell title="Efficiency Metrics" subtitle="Operational performance indicators">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-5">
                  <p className="text-sm text-zinc-600 dark:text-white/45 mb-2">Avg Job Duration</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {(data.jobs?.avgDuration || 0) % 60 === 0
                      ? `${((data.jobs?.avgDuration || 0) / 60).toFixed(0)} ${(data.jobs?.avgDuration || 0) / 60 === 1 ? 'hr' : 'hrs'}`
                      : `${((data.jobs?.avgDuration || 0) / 60).toFixed(1)} hrs`}
                  </p>
                </div>
                
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-5">
                  <p className="text-sm text-zinc-600 dark:text-white/45 mb-2">Total Estimated Value</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{currency(data.jobs?.totalEstimatedValue || 0)}</p>
                </div>
                
                <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-5">
                  <p className="text-sm text-zinc-600 dark:text-white/45 mb-2">Avg Job Cost</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{currency(data.jobs?.avgCost || 0)}</p>
                </div>
              </div>
            </CardShell>

            {/* Client Analytics */}
            <CardShell title="Client Analytics" subtitle="Customer growth and retention">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-cyan-500/20 dark:ring-cyan-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-100/50 dark:bg-cyan-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <Users className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">New Clients</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{data.clients?.new || 0}</p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <Users className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Repeat Clients</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{data.clients?.repeat || 0}</p>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 dark:border-violet-500/30 bg-gradient-to-br from-violet-500/18 dark:from-violet-500/18 to-violet-500/5 dark:to-violet-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-violet-500/20 dark:ring-violet-500/20">
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-100/50 dark:bg-violet-500/5 blur-2xl" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                      <Users className="h-5 w-5 text-zinc-700 dark:text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-white/65">Total Clients</p>
                  </div>
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{data.clients?.total || 0}</p>
                </div>
              </div>
            </CardShell>

            {/* Key Insights */}
            <CardShell title="Key Insights" subtitle="Actionable recommendations">
              <div className="space-y-3">
                {(data.insights || []).map((insight: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                    {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />}
                    {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />}
                    {insight.type === 'info' && <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />}
                    <p className="text-sm text-zinc-900 dark:text-white/80">{insight.message}</p>
                  </div>
                ))}
              </div>
            </CardShell>
          </div>
        </div>
      </div>
    </div>
  )
}
