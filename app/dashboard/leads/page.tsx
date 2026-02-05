export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getLeads } from '@/lib/actions/leads'
import { getLeadOverviewStats } from '@/lib/actions/lead-overview'
import { canUseFullAutomation, getMaxLeadsForCurrentBusiness, canAddMoreLeads, canUseLeadRecoveryDashboard } from '@/lib/actions/permissions'
import { getBusiness } from '@/lib/actions/business'
import { getTierFromBusiness } from '@/lib/permissions'
import { LeadsRecoveryCommandCenter } from '@/components/leads/recovery-command-center'
import { DashboardPageError } from '@/components/dashboard/page-error'

export default async function BookingsPage() {
  let business
  let userEmail: string | null = null
  let tier: string | null = null
  let canUseAutomation = false
  let maxLeads = 0
  let leadLimitInfo: Awaited<ReturnType<typeof canAddMoreLeads>> | null = null
  let allLeads: Awaited<ReturnType<typeof getLeads>> = []

  try {
    business = await getBusiness()
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email || null
    tier = business ? getTierFromBusiness(business, userEmail) : null
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

  const canUseInbox = await canUseLeadRecoveryDashboard()

  const isStarter = tier === 'starter'

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

  // Leads that need immediate action
  const needsActionLeads = allLeads.filter((l: any) => {
    if (l.status === 'booked' || l.status === 'lost') return false
    if (!l.last_contacted_at) return true // Never contacted
    const hoursSinceContact = (Date.now() - new Date(l.last_contacted_at).getTime()) / (1000 * 60 * 60)
    if (l.score === 'hot' && hoursSinceContact >= 24) return true
    if (l.score === 'warm' && hoursSinceContact >= 48) return true
    return false
  })

  return (
    <LeadsRecoveryCommandCenter
      allLeads={allLeads}
      newLeads={newLeads}
      incompleteLeads={incompleteLeads}
      followingUpLeads={followingUpLeads}
      bookedLeads={bookedLeads}
      notInterestedLeads={notInterestedLeads}
      needsActionLeads={needsActionLeads}
      overviewStats={overviewStats}
      isStarter={isStarter}
      leadLimitInfo={leadLimitInfo ?? { canAdd: false }}
      maxLeads={maxLeads}
      canUseAutomation={canUseAutomation}
      canUseInbox={canUseInbox}
    />
  )
}
