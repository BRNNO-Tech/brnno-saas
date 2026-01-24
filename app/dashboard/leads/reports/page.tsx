export const dynamic = 'force-dynamic'

import { canUseLeadRecoveryDashboard } from '@/lib/actions/permissions'
import { getLeadReportsData } from '@/lib/actions/lead-reports'
import UpgradePrompt from '@/components/upgrade-prompt'
import { GlowBG } from '@/components/ui/glow-bg'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign, TrendingUp } from 'lucide-react'
import { RevenueChart } from '@/components/leads/reports/revenue-chart'
import { ChannelConversionChart } from '@/components/leads/reports/channel-conversion-chart'
import { ConversionFunnel } from '@/components/leads/reports/conversion-funnel'
import { SpeedDistributionChart } from '@/components/leads/reports/speed-distribution-chart'
import { TopSequencesTable } from '@/components/leads/reports/top-sequences-table'
import { KpiCard } from '@/components/leads/kpi-card'
import { CardShell } from '@/components/ui/card-shell'

export default async function ReportsPage() {
  // Handle authentication errors gracefully
  let canUseDashboard = false
  try {
    canUseDashboard = await canUseLeadRecoveryDashboard()
  } catch (error) {
    // User is not authenticated or there's an auth error
    canUseDashboard = false
  }

  if (!canUseDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt requiredTier="pro" feature="Lead Recovery Reports" />
          </div>
        </div>
      </div>
    )
  }

  // Fetch reports data with error handling
  let reportsData
  try {
    reportsData = await getLeadReportsData(30)
  } catch (error) {
    // If data fetch fails (e.g., user logged out during render), return empty data
    reportsData = {
      recoveredRevenue30d: 0,
      recoveredRevenueTrend: 0,
      revenueOverTime: [],
      channelConversions: [],
      funnelData: [],
      topSequences: [],
      speedToLeadDistribution: [],
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="icon" className="hover:bg-zinc-100 dark:hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                ROI tracking and performance insights
              </p>
            </div>
          </div>

          {/* Hero Card - Recovered Revenue */}
          <CardShell 
            title="" 
            subtitle=""
            className="mb-6 bg-gradient-to-br from-emerald-500/10 dark:from-emerald-500/10 to-violet-500/10 dark:to-violet-500/10 border-emerald-500/20 dark:border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-white/55 mb-1">Recovered Revenue (30d)</p>
                <p className="text-4xl font-bold text-zinc-900 dark:text-white">
                  ${reportsData.recoveredRevenue30d.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-600 dark:text-white/55 mt-2 italic">
                  This is money you would've lost.
                </p>
              </div>
              <div className="text-right">
                <KpiCard
                  title="Trend"
                  value={reportsData.recoveredRevenueTrend >= 0 ? `+${reportsData.recoveredRevenueTrend.toFixed(0)}%` : `${reportsData.recoveredRevenueTrend.toFixed(0)}%`}
                  sub="vs previous 30 days"
                  trend={reportsData.recoveredRevenueTrend >= 0 ? `+${reportsData.recoveredRevenueTrend.toFixed(0)}%` : `${reportsData.recoveredRevenueTrend.toFixed(0)}%`}
                  trendDir={reportsData.recoveredRevenueTrend >= 0 ? 'up' : 'down'}
                  icon="TrendingUp"
                  tone="emerald"
                />
              </div>
            </div>
          </CardShell>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <RevenueChart data={reportsData.revenueOverTime} />
            <ChannelConversionChart data={reportsData.channelConversions} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <ConversionFunnel data={reportsData.funnelData} />
            <SpeedDistributionChart data={reportsData.speedToLeadDistribution} />
          </div>

          {/* Top Sequences Table */}
          <div className="mb-6">
            <TopSequencesTable sequences={reportsData.topSequences} />
          </div>
        </div>
      </div>
    </div>
  )
}
