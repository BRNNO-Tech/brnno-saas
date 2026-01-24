'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLeadAnalytics(
  timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
) {
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

  // Calculate date range
  const now = new Date()
  const startDate = new Date()

  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  // Get all leads in timeframe
  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .gte('created_at', startDate.toISOString())

  if (!allLeads) return null

  // Total leads
  const totalLeads = allLeads.length

  // Booked leads (was 'converted')
  const bookedLeads = allLeads.filter((l) => l.status === 'booked' || l.status === 'converted') // Support both for migration
  const conversionRate =
    totalLeads > 0 ? (bookedLeads.length / totalLeads) * 100 : 0

  // Revenue recovered (sum of estimated_value for booked leads)
  const revenueRecovered = bookedLeads.reduce((sum, lead) => {
    return sum + (lead.estimated_value || 0)
  }, 0)

  // Average time to convert (in days)
  const conversionTimes = bookedLeads
    .filter((l) => l.converted_at && l.created_at)
    .map((l) => {
      const created = new Date(l.created_at).getTime()
      const converted = new Date(l.converted_at!).getTime()
      return (converted - created) / (1000 * 60 * 60 * 24) // days
    })

  const avgTimeToConvert =
    conversionTimes.length > 0
      ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length
      : 0

  // Conversion rate by source
  const sourceStats: Record<
    string,
    { total: number; converted: number; rate: number; revenue: number }
  > = {}

  allLeads.forEach((lead) => {
    const source = lead.source || 'unknown'
    if (!sourceStats[source]) {
      sourceStats[source] = { total: 0, converted: 0, rate: 0, revenue: 0 }
    }
    sourceStats[source].total++
    if (lead.status === 'booked' || lead.status === 'converted') { // Support both for migration
      sourceStats[source].converted++
      sourceStats[source].revenue += lead.estimated_value || 0
    }
  })

  // Calculate conversion rates
  Object.keys(sourceStats).forEach((source) => {
    const stats = sourceStats[source]
    stats.rate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
  })

  // Sort by conversion rate
  const sourceBreakdown = Object.entries(sourceStats)
    .map(([source, stats]) => ({
      source,
      ...stats,
    }))
    .sort((a, b) => b.rate - a.rate)

  // Best performing services (most conversions)
  const serviceStats: Record<
    string,
    {
      name: string
      total: number
      converted: number
      rate: number
      revenue: number
    }
  > = {}

  allLeads.forEach((lead) => {
    if (lead.interested_in_service_name) {
      const serviceName = lead.interested_in_service_name
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = {
          name: serviceName,
          total: 0,
          converted: 0,
          rate: 0,
          revenue: 0,
        }
      }
      serviceStats[serviceName].total++
      if (lead.status === 'booked' || lead.status === 'converted') { // Support both for migration
        serviceStats[serviceName].converted++
        serviceStats[serviceName].revenue += lead.estimated_value || 0
      }
    }
  })

  Object.keys(serviceStats).forEach((service) => {
    const stats = serviceStats[service]
    stats.rate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
  })

  const serviceBreakdown = Object.values(serviceStats)
    .sort((a, b) => b.converted - a.converted)
    .slice(0, 5) // Top 5 services

  // Lead score distribution
  const scoreDistribution = {
    hot: allLeads.filter(
      (l) =>
        l.score === 'hot' && l.status !== 'booked' && l.status !== 'converted' && l.status !== 'lost'
    ).length,
    warm: allLeads.filter(
      (l) =>
        l.score === 'warm' && l.status !== 'booked' && l.status !== 'converted' && l.status !== 'lost'
    ).length,
    cold: allLeads.filter(
      (l) =>
        l.score === 'cold' && l.status !== 'booked' && l.status !== 'converted' && l.status !== 'lost'
    ).length,
  }

  // Status breakdown
  const statusBreakdown = {
    new: allLeads.filter((l) => l.status === 'new').length,
    in_progress: allLeads.filter((l) => l.status === 'in_progress' || l.status === 'contacted').length,
    quoted: allLeads.filter((l) => l.status === 'quoted').length,
    nurturing: allLeads.filter((l) => l.status === 'nurturing').length,
    booked: allLeads.filter((l) => l.status === 'booked' || l.status === 'converted').length,
    lost: allLeads.filter((l) => l.status === 'lost').length,
  }

  // Response rate (leads with at least one interaction)
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('lead_id')
    .eq('business_id', business.id)

  const leadsWithInteractions = new Set(
    interactions?.map((i) => i.lead_id) || []
  )
  const responseRate =
    totalLeads > 0 ? (leadsWithInteractions.size / totalLeads) * 100 : 0

  // Calculate trend (compare to previous period)
  const previousPeriodStart = new Date(startDate)
  previousPeriodStart.setTime(
    startDate.getTime() - (now.getTime() - startDate.getTime())
  )

  const { data: previousLeads } = await supabase
    .from('leads')
    .select('id')
    .eq('business_id', business.id)
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', startDate.toISOString())

  const previousTotal = previousLeads?.length || 0
  const trend =
    previousTotal > 0 ? ((totalLeads - previousTotal) / previousTotal) * 100 : 0

  return {
    timeframe,
    overview: {
      totalLeads,
      convertedLeads: bookedLeads.length, // Keep field name for compatibility
      conversionRate,
      revenueRecovered,
      avgTimeToConvert,
      responseRate,
      trend,
    },
    sourceBreakdown,
    serviceBreakdown,
    scoreDistribution,
    statusBreakdown,
  }
}
