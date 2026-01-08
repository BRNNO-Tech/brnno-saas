export const dynamic = 'force-dynamic'

import { getLeads } from '@/lib/actions/leads'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { BarChart, Zap, Lock, AlertCircle } from 'lucide-react'
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

  const hotLeads = allLeads.filter(
    (l: any) => l.score === 'hot' && l.status !== 'converted' && l.status !== 'lost'
  )
  const warmLeads = allLeads.filter(
    (l: any) => l.score === 'warm' && l.status !== 'converted' && l.status !== 'lost'
  )
  const coldLeads = allLeads.filter(
    (l: any) => l.score === 'cold' && l.status !== 'converted' && l.status !== 'lost'
  )
  const convertedLeads = allLeads.filter((l: any) => l.status === 'converted')
  const lostLeads = allLeads.filter((l: any) => l.status === 'lost')
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Lead Recovery</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Track and convert potential customers
            {isStarter && maxLeads > 0 && (
              <span className="ml-2 text-sm">
                ({allLeads.length}/{maxLeads} leads)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canUseAutomation ? (
            <>
              <Link href="/dashboard/leads/sequences">
                <Button variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Automated Sequences
                </Button>
              </Link>
              <Link href="/dashboard/leads/analytics">
                <Button variant="outline">
                  <BarChart className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                <Lock className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Automation</span>
              </Button>
              <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                <Lock className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </div>
          )}
        <AddLeadButton canAddMore={leadLimitInfo.canAdd} />
      </div>
      </div>

      {/* Starter Plan Limitations Notice */}
      {isStarter && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Starter Plan Limitations
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                You're on the Starter plan with limited lead recovery. You can track up to <strong>{maxLeads} leads</strong>.
                {!leadLimitInfo.canAdd && (
                  <span className="block mt-1">
                    <strong>You've reached your limit!</strong> Upgrade to Pro for unlimited leads, advanced analytics, and automation features.
                  </span>
                )}
              </p>
              <Link href="/pricing" className="mt-2 inline-block">
                <Button size="sm" variant="outline" className="border-yellow-300 dark:border-yellow-700">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Warning */}
      {!leadLimitInfo.canAdd && maxLeads > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Lead Limit Reached
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                You've reached your limit of {maxLeads} leads. Upgrade to Pro for unlimited leads and advanced features.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm">Upgrade Now</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-600/20 via-red-500/10 to-rose-500/20 border-red-500/30">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-zinc-300">
              Hot Leads
            </p>
          </div>
          <p className="text-3xl font-bold text-white">{hotLeads.length}</p>
          <p className="text-xs text-zinc-400">
            Need immediate follow-up
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-amber-500/20 border-orange-500/30">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-sm font-medium text-zinc-300">
              Warm Leads
            </p>
          </div>
          <p className="text-3xl font-bold text-white">{warmLeads.length}</p>
          <p className="text-xs text-zinc-400">
            Active opportunities
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/20 border-blue-500/30">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-sm font-medium text-zinc-300">
              Cold Leads
            </p>
          </div>
          <p className="text-3xl font-bold text-white">{coldLeads.length}</p>
          <p className="text-xs text-zinc-400">
            Need re-engagement
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-emerald-500/20 border-green-500/30">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-zinc-300">
              Converted
            </p>
          </div>
          <p className="text-3xl font-bold text-white">{convertedLeads.length}</p>
          <p className="text-xs text-zinc-400">
            This month
          </p>
        </Card>
      </div>

      <Tabs defaultValue="hot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hot">🔥 Hot ({hotLeads.length})</TabsTrigger>
          <TabsTrigger value="warm">🌡️ Warm ({warmLeads.length})</TabsTrigger>
          <TabsTrigger value="cold">❄️ Cold ({coldLeads.length})</TabsTrigger>
          <TabsTrigger value="converted">
            ✅ Converted ({convertedLeads.length})
          </TabsTrigger>
          <TabsTrigger value="lost">❌ Lost ({lostLeads.length})</TabsTrigger>
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

        <TabsContent value="converted">
          <LeadList leads={convertedLeads} type="converted" />
        </TabsContent>

        <TabsContent value="lost">
          <LeadList leads={lostLeads} type="lost" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

