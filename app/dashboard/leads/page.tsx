export const dynamic = 'force-dynamic'

import { getLeads } from '@/lib/actions/leads'
import { getLeadOverviewStats } from '@/lib/actions/lead-overview'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'
import { KpiCard } from '@/components/leads/kpi-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'
import { BarChart, Zap, Lock, AlertCircle, TrendingUp, Lightbulb, FileCode, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { canUseLeadRecoveryDashboard, canUseFullAutomation, getCurrentTier, getMaxLeadsForCurrentBusiness, canAddMoreLeads } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'
import { getBusiness } from '@/lib/actions/business'
import { getTierFromBusiness } from '@/lib/permissions'

export default async function LeadsPage() {
  const business = await getBusiness()
  const tier = business ? getTierFromBusiness(business) : null
  const canUseDashboard = await canUseLeadRecoveryDashboard()
  const canUseAutomation = await canUseFullAutomation()
  const maxLeads = await getMaxLeadsForCurrentBusiness()
  const leadLimitInfo = await canAddMoreLeads()
  
  // Starter plan can access leads but with limitations
  // Pro+ gets full dashboard features
  const allLeads = await getLeads('all')
  const isStarter = tier === 'starter'

  // Get overview stats
  let overviewStats
  try {
    overviewStats = await getLeadOverviewStats()
  } catch (error) {
    console.error('Error loading overview stats:', error)
    overviewStats = {
      recoveredRevenue: 0,
      recoveredRevenueTrend: 0,
      bookingsFromRecovery: 0,
      atRiskLeads: 0,
      speedToLead: 0,
      replyRate: 0,
      hotLeadsCount: 0,
      needsIncentiveCount: 0,
      missedCallsCount: 0,
    }
  }

  const hotLeads = allLeads.filter(
    (l: any) => l.score === 'hot' && l.status !== 'booked' && l.status !== 'lost'
  )
  const warmLeads = allLeads.filter(
    (l: any) => l.score === 'warm' && l.status !== 'booked' && l.status !== 'lost'
  )
  const coldLeads = allLeads.filter(
    (l: any) => l.score === 'cold' && l.status !== 'booked' && l.status !== 'lost'
  )
  const bookedLeads = allLeads.filter((l: any) => l.status === 'booked')
  const lostLeads = allLeads.filter((l: any) => l.status === 'lost')

  // At-risk leads (hot/warm that need attention)
  const atRiskLeads = allLeads.filter((l: any) => {
    if (l.status === 'booked' || l.status === 'lost') return false
    if (!l.last_contacted_at) return true // Never contacted
    const hoursSinceContact = (Date.now() - new Date(l.last_contacted_at).getTime()) / (1000 * 60 * 60)
    if (l.score === 'hot' && hoursSinceContact >= 24) return true
    if (l.score === 'warm' && hoursSinceContact >= 48) return true
    return false
  }).slice(0, 10) // Limit to top 10 for display
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Recovery Command Center</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Track recovered revenue, at-risk leads, and what to do next.
                {isStarter && maxLeads > 0 && (
                  <span className="ml-2">
                    ({allLeads.length}/{maxLeads} leads)
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              {canUseAutomation ? (
                <>
                  <Link href="/dashboard/leads/sequences">
                    <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automated Sequences
                    </button>
                  </Link>
                  <Link href="/dashboard/leads/analytics">
                    <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      View Analytics
                    </button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Automation</span>
                  </button>
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </button>
                </div>
              )}
              <AddLeadButton canAddMore={leadLimitInfo.canAdd} />
            </div>
          </div>

          {/* Starter Plan Limitations Notice */}
          {isStarter && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 backdrop-blur-sm p-4 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Starter Plan Limitations
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    You're on the Starter plan with limited lead recovery. You can track up to <strong>{maxLeads} leads</strong>.
                    {!leadLimitInfo.canAdd && (
                      <span className="block mt-1">
                        <strong>You've reached your limit!</strong> Upgrade to Pro for unlimited leads, advanced analytics, and automation features.
                      </span>
                    )}
                  </p>
                  <Link href="/pricing" className="mt-2 inline-block">
                    <button className="rounded-2xl border border-amber-500/30 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/20 transition-colors">
                      Upgrade to Pro
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Limit Reached Warning */}
          {!leadLimitInfo.canAdd && maxLeads > 0 && (
            <div className="mb-6 rounded-2xl border border-rose-500/30 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 backdrop-blur-sm p-4 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                    Lead Limit Reached
                  </p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
                    You've reached your limit of {maxLeads} leads. Upgrade to Pro for unlimited leads and advanced features.
                  </p>
                </div>
                <Link href="/pricing">
                  <button className="rounded-2xl border border-rose-500/30 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 dark:hover:bg-rose-500/20 transition-colors">
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* KPI Row - 5 Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-5">
            {/* Recovered Revenue - Biggest Card (col-span-2 on larger screens) */}
            <KpiCard
              title="Recovered Revenue"
              value={`$${overviewStats.recoveredRevenue.toLocaleString()}`}
              sub={overviewStats.recoveredRevenueTrend >= 0 ? `+${overviewStats.recoveredRevenueTrend.toFixed(0)}% vs last 30 days` : `${overviewStats.recoveredRevenueTrend.toFixed(0)}% vs last 30 days`}
              trend={overviewStats.recoveredRevenueTrend >= 0 ? `+${overviewStats.recoveredRevenueTrend.toFixed(0)}%` : `${overviewStats.recoveredRevenueTrend.toFixed(0)}%`}
              trendDir={overviewStats.recoveredRevenueTrend >= 0 ? 'up' : 'down'}
              icon="DollarSign"
              tone="emerald"
              href="/dashboard/leads/inbox?filter=booked"
              className="md:col-span-2"
            />
            
            <KpiCard
              title="Bookings From Recovery"
              value={String(overviewStats.bookingsFromRecovery)}
              icon="Users"
              tone="violet"
              href="/dashboard/leads/inbox?filter=booked"
            />
            
            <KpiCard
              title="At-Risk Leads"
              value={String(overviewStats.atRiskLeads)}
              icon="AlertTriangle"
              tone="orange"
              href="/dashboard/leads/inbox?filter=at-risk"
            />
            
            <KpiCard
              title="Speed-to-Lead"
              value={overviewStats.speedToLead > 0 ? `${Math.round(overviewStats.speedToLead)}s median` : 'N/A'}
              sub="Time to first contact"
              icon="Clock"
              tone="cyan"
            />
            
            <KpiCard
              title="Reply Rate"
              value={`${overviewStats.replyRate}%`}
              icon="MessageSquare"
              tone="amber"
            />
          </div>

          {/* Do This Now Panel + At-Risk Table + Insights */}
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            {/* Left Column: Do This Now + At-Risk Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Do This Now Panel */}
              <CardShell title="Next Best Actions" subtitle="High-conversion opportunities">
                <div className="space-y-3">
                  {overviewStats.hotLeadsCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-violet-500/20 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 p-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {overviewStats.hotLeadsCount} lead{overviewStats.hotLeadsCount !== 1 ? 's are' : ' is'} hot — reply now
                        </p>
                      </div>
                      <Link href="/dashboard/leads/inbox?filter=hot">
                        <Button size="sm" variant="outline">Open Queue</Button>
                      </Link>
                    </div>
                  )}
                  
                  {overviewStats.needsIncentiveCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {overviewStats.needsIncentiveCount} lead{overviewStats.needsIncentiveCount !== 1 ? 's need' : ' needs'} an incentive
                        </p>
                      </div>
                      <Link href="/dashboard/leads/inbox?filter=needs-incentive">
                        <Button size="sm" variant="outline">Open Queue</Button>
                      </Link>
                    </div>
                  )}
                  
                  {overviewStats.missedCallsCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-orange-500/20 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/15 p-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {overviewStats.missedCallsCount} missed call{overviewStats.missedCallsCount !== 1 ? 's need' : ' needs'} a callback
                        </p>
                      </div>
                      <Link href="/dashboard/leads/inbox?filter=missed-calls">
                        <Button size="sm" variant="outline">Open Queue</Button>
                      </Link>
                    </div>
                  )}
                  
                  {overviewStats.hotLeadsCount === 0 && overviewStats.needsIncentiveCount === 0 && overviewStats.missedCallsCount === 0 && (
                    <p className="text-sm text-zinc-600 dark:text-white/55 text-center py-4">
                      All caught up! No urgent actions needed.
                    </p>
                  )}
                </div>
              </CardShell>

              {/* At-Risk Leads Table */}
              {atRiskLeads.length > 0 && (
                <CardShell title="At-Risk Leads" subtitle="Leads that need immediate attention">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-200/50 dark:border-white/10">
                          <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-white/55">Lead</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-white/55">Service</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-white/55">Last Touch</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-white/55">Score</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-white/55">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atRiskLeads.map((lead: any) => {
                          const hoursSinceContact = lead.last_contacted_at 
                            ? Math.round((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60))
                            : null
                          
                          return (
                            <tr key={lead.id} className="border-b border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5">
                              <td className="py-3 px-4">
                                <Link href={`/dashboard/leads/${lead.id}`} className="hover:underline">
                                  <div className="font-medium text-zinc-900 dark:text-white">{lead.name}</div>
                                  {lead.phone && (
                                    <div className="text-xs text-zinc-600 dark:text-white/55">{lead.phone}</div>
                                  )}
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-sm text-zinc-700 dark:text-white/70">
                                {lead.interested_in_service_name || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm text-zinc-600 dark:text-white/55">
                                {hoursSinceContact !== null ? `${hoursSinceContact}h ago` : 'Never'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  lead.score === 'hot' ? 'bg-red-500/15 text-red-700 dark:text-red-300' :
                                  lead.score === 'warm' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300' :
                                  'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                                }`}>
                                  {lead.score}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {lead.phone && (
                                    <a href={`tel:${lead.phone}`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                                      Call
                                    </a>
                                  )}
                                  <Link href={`/dashboard/leads/${lead.id}`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                                    View
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardShell>
              )}
            </div>

            {/* Right Column: Insights Cards */}
            <div className="space-y-4">
              <CardShell title="Insights" subtitle="Quick tips">
                <div className="space-y-4">
                  <div className="rounded-xl border border-cyan-500/20 dark:border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/15 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Best time to text</p>
                        <p className="text-xs text-zinc-600 dark:text-white/55 mt-1">6–8pm</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-violet-500/20 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 p-4">
                    <div className="flex items-start gap-3">
                      <FileCode className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Top script</p>
                        <p className="text-xs text-zinc-600 dark:text-white/55 mt-1">'Quick lock-in'</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-orange-500/20 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/15 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Most lost stage</p>
                        <p className="text-xs text-zinc-600 dark:text-white/55 mt-1">After quote</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardShell>
            </div>
          </div>

          <CardShell title="Lead Management" subtitle="Organize and track your leads by priority">
            <Tabs defaultValue="hot" className="space-y-4">
              <TabsList className="bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                <TabsTrigger value="hot" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">🔥 Hot ({hotLeads.length})</TabsTrigger>
                <TabsTrigger value="warm" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">🌡️ Warm ({warmLeads.length})</TabsTrigger>
                <TabsTrigger value="cold" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">❄️ Cold ({coldLeads.length})</TabsTrigger>
                <TabsTrigger value="booked" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  ✅ Booked ({bookedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="lost" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">❌ Lost ({lostLeads.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="hot">
                <LeadList leads={hotLeads} type="hot" />
              </TabsContent>

              <TabsContent value="warm">
                <LeadList leads={warmLeads} type="warm" />
              </TabsContent>

              <TabsContent value="cold">
                <LeadList leads={coldLeads} type="cold" />
              </TabsContent>

              <TabsContent value="booked">
                <LeadList leads={bookedLeads} type="booked" />
              </TabsContent>

              <TabsContent value="lost">
                <LeadList leads={lostLeads} type="lost" />
              </TabsContent>
            </Tabs>
          </CardShell>
        </div>
      </div>
    </div>
  )
}

