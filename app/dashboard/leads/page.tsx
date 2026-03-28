export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getLeads } from '@/lib/actions/leads'
import { getLeadOverviewStats } from '@/lib/actions/lead-overview'
import { canUseFullAutomation, getMaxLeadsForCurrentBusiness, canAddMoreLeads, canAccessLeadRecovery } from '@/lib/actions/permissions'
import { getBusiness } from '@/lib/actions/business'
import { LeadsRecoveryCommandCenter } from '@/components/leads/recovery-command-center'
import { DashboardPageError } from '@/components/dashboard/page-error'
import UpgradePrompt from '@/components/upgrade-prompt'

export default async function BookingsPage() {
  const canView = await canAccessLeadRecovery()
  if (!canView) {
    return <UpgradePrompt moduleMode feature="Lead Recovery" />
  }
  let business
  let canUseAutomation = false
  let maxLeads = 0
  let leadLimitInfo: Awaited<ReturnType<typeof canAddMoreLeads>> | null = null
  let allLeads: Awaited<ReturnType<typeof getLeads>> = []

  try {
    business = await getBusiness()
    canUseAutomation = await canUseFullAutomation()
    maxLeads = await getMaxLeadsForCurrentBusiness()
    leadLimitInfo = await canAddMoreLeads()
    allLeads = await getLeads('all')
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred.'
    try {
      const b = await getBusiness()
      if (b && b.subscription_status !== 'active' && b.subscription_status !== 'trialing') {
        return <DashboardPageError isTrialEnded />
      }
    } catch { /* ignore */ }
    if (msg.includes('Not authenticated') || msg.includes('Authentication error')) {
      redirect('/login')
    }
    const isNoBusiness = msg.includes('No business found')
    return (
      <DashboardPageError
        message={msg}
        isNoBusiness={isNoBusiness}
        title={isNoBusiness ? 'Business Setup Required' : 'Unable to load leads'}
      />
    )
  }

  const canUseInbox = canView

  // Get overview stats
  let overviewStats
  try {
    overviewStats = await getLeadOverviewStats()
  } catch (error) {
    console.error('Error loading overview stats:', error)
    overviewStats = {
      recoveredRevenue: 0,
      bookingsFromRecovery: 0,
      atRiskLeads: 0,
    }
  }

  // Organize leads by simple categories
  const newLeads = allLeads.filter(
    (l: any) => l.status !== 'booked' && l.status !== 'lost' && !l.last_contacted_at
  )

  const incompleteLeads = allLeads.filter(
    (l: any) => l.score === 'hot' && l.status !== 'booked' && l.status !== 'lost'
  )

  const followingUpLeads = allLeads.filter(
    (l: any) => l.score === 'warm' && l.status !== 'booked' && l.status !== 'lost'
  )

  const bookedLeads = allLeads.filter((l: any) => l.status === 'booked')
  const notInterestedLeads = allLeads.filter((l: any) => l.status === 'lost')

  // Leads that need immediate action (never contacted, hot/warm past contact threshold, or follow-up due)
  const today = new Date().toISOString().slice(0, 10)
  const needsActionLeads = allLeads.filter((l: any) => {
    if (l.status === 'booked' || l.status === 'lost') return false
    // Needs follow-up: reminder date due and reminder not sent
    if (l.next_follow_up_date != null && l.next_follow_up_date <= today && l.reminder_sent !== true) return true
    // Never contacted
    if (!l.last_contacted_at) return true
    const hoursSinceContact = (Date.now() - new Date(l.last_contacted_at).getTime()) / (1000 * 60 * 60)
    if (l.score === 'hot' && hoursSinceContact >= 24) return true
    if (l.score === 'warm' && hoursSinceContact >= 48) return true
    return false
  })

  return (
    <div className="w-full pb-20 md:pb-0">
      <LeadsRecoveryCommandCenter
        allLeads={allLeads}
        newLeads={newLeads}
        incompleteLeads={incompleteLeads}
        followingUpLeads={followingUpLeads}
        bookedLeads={bookedLeads}
        notInterestedLeads={notInterestedLeads}
        needsActionLeads={needsActionLeads}
        overviewStats={overviewStats}
        leadLimitInfo={leadLimitInfo ?? { canAdd: false }}
        maxLeads={maxLeads}
        canUseAutomation={canUseAutomation}
        canUseInbox={canUseInbox}
      />
    </div>
  )
}
