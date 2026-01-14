'use server'

import { createClient } from '@/lib/supabase/server'

export interface LeadOverviewStats {
  recoveredRevenue: number
  recoveredRevenueTrend: number // percentage change vs last 30 days
  bookingsFromRecovery: number
  atRiskLeads: number
  speedToLead: number // median in seconds
  replyRate: number // percentage
  hotLeadsCount: number
  needsIncentiveCount: number
  missedCallsCount: number
}

export async function getLeadOverviewStats(): Promise<LeadOverviewStats> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('No business found. Please complete your business setup in Settings.')
  }

  const now = new Date()
  const last30Days = new Date()
  last30Days.setDate(now.getDate() - 30)
  const previous30Days = new Date()
  previous30Days.setDate(now.getDate() - 60)

  // Get all leads from last 30 days
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .gte('created_at', last30Days.toISOString())

  // Get booked leads from last 30 days
  const bookedLeads = recentLeads?.filter(l => l.status === 'booked') || []
  
  // Calculate recovered revenue (sum of estimated_value for booked leads)
  const recoveredRevenue = bookedLeads.reduce((sum, lead) => {
    return sum + (lead.estimated_value || 0)
  }, 0)

  // Get previous 30 days revenue for trend
  const { data: previousLeads } = await supabase
    .from('leads')
    .select('estimated_value, status')
    .eq('business_id', business.id)
    .gte('created_at', previous30Days.toISOString())
    .lt('created_at', last30Days.toISOString())

  const previousBookedLeads = previousLeads?.filter(l => l.status === 'booked') || []
  const previousRevenue = previousBookedLeads.reduce((sum, lead) => {
    return sum + (lead.estimated_value || 0)
  }, 0)

  const recoveredRevenueTrend = previousRevenue > 0 
    ? ((recoveredRevenue - previousRevenue) / previousRevenue) * 100 
    : 0

  // Bookings from recovery
  const bookingsFromRecovery = bookedLeads.length

  // At-risk leads (hot leads that haven't been contacted in 24+ hours, or warm leads not contacted in 48+ hours)
  const { data: allActiveLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .in('status', ['new', 'in_progress', 'quoted'])
    .not('status', 'eq', 'booked')
    .not('status', 'eq', 'lost')

  const atRiskLeads = (allActiveLeads || []).filter(lead => {
    if (!lead.last_contacted_at) return true // Never contacted = at risk
    
    const hoursSinceContact = (now.getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60)
    
    if (lead.score === 'hot' && hoursSinceContact >= 24) return true
    if (lead.score === 'warm' && hoursSinceContact >= 48) return true
    
    return false
  })

  // Speed-to-lead: median time from lead creation to first contact
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('lead_id, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })

  const leadFirstContact: Record<string, Date> = {}
  interactions?.forEach(interaction => {
    if (!leadFirstContact[interaction.lead_id]) {
      leadFirstContact[interaction.lead_id] = new Date(interaction.created_at)
    }
  })

  const speeds: number[] = []
  recentLeads?.forEach(lead => {
    const firstContact = leadFirstContact[lead.id]
    if (firstContact) {
      const speedSeconds = (firstContact.getTime() - new Date(lead.created_at).getTime()) / 1000
      speeds.push(speedSeconds)
    }
  })

  const speedToLead = speeds.length > 0
    ? speeds.sort((a, b) => a - b)[Math.floor(speeds.length / 2)] // median
    : 0

  // Reply rate: percentage of leads that have replied (have inbound interactions)
  const { data: inboundInteractions } = await supabase
    .from('lead_interactions')
    .select('lead_id')
    .eq('business_id', business.id)
    .eq('direction', 'inbound')

  const leadsWithReplies = new Set(inboundInteractions?.map(i => i.lead_id) || [])
  const replyRate = recentLeads && recentLeads.length > 0
    ? (leadsWithReplies.size / recentLeads.length) * 100
    : 0

  // Hot leads count
  const hotLeads = (allActiveLeads || []).filter(l => l.score === 'hot' && l.status !== 'booked' && l.status !== 'lost')
  const hotLeadsCount = hotLeads.length

  // Leads that need incentive (quoted but not booked, older than 48 hours)
  const needsIncentive = (allActiveLeads || []).filter(lead => {
    if (lead.status !== 'quoted') return false
    if (!lead.last_contacted_at) return false
    
    const hoursSinceQuote = (now.getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60)
    return hoursSinceQuote >= 48
  })
  const needsIncentiveCount = needsIncentive.length

  // Missed calls (leads with phone but no recent contact)
  const missedCalls = (allActiveLeads || []).filter(lead => {
    if (!lead.phone) return false
    if (!lead.last_contacted_at) return true
    
    const hoursSinceContact = (now.getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60)
    return hoursSinceContact >= 24
  })
  const missedCallsCount = missedCalls.length

  return {
    recoveredRevenue,
    recoveredRevenueTrend,
    bookingsFromRecovery,
    atRiskLeads: atRiskLeads.length,
    speedToLead: Math.round(speedToLead),
    replyRate: Math.round(replyRate * 10) / 10, // Round to 1 decimal
    hotLeadsCount,
    needsIncentiveCount,
    missedCallsCount,
  }
}
