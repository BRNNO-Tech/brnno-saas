'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLeadAnalytics(
  timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
) {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return {
      timeframe,
      overview: {
        totalLeads: 12,
        convertedLeads: 4,
        conversionRate: 33.3,
        revenueRecovered: 1249.97,
        avgTimeToConvert: 2.5,
        responseRate: 65,
        trend: 15.5,
      },
      sourceBreakdown: [
        { source: 'online_booking', total: 5, converted: 2, rate: 40, revenue: 599.98 },
        { source: 'website', total: 4, converted: 1, rate: 25, revenue: 299.99 },
        { source: 'referral', total: 3, converted: 1, rate: 33.3, revenue: 349.99 },
      ],
      serviceBreakdown: [
        { name: 'Full Detail Package', total: 4, converted: 2, rate: 50, revenue: 599.98 },
        { name: 'Interior Deep Clean', total: 3, converted: 1, rate: 33.3, revenue: 149.99 },
      ],
      scoreDistribution: { hot: 2, warm: 3, cold: 1 },
      statusBreakdown: {
        new: 2,
        in_progress: 3,
        quoted: 2,
        nurturing: 1,
        booked: 4,
        lost: 0,
      },
    }
  }

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

export async function getLeadSourceAnalytics(
  range: 'month' | '30days' | 'alltime'
): Promise<Array<{ source: string; count: number; revenue: number }>> {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return [
      { source: 'instagram', count: 12, revenue: 1450 },
      { source: 'google', count: 8, revenue: 960 },
    ]
  }

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
  let startDate: Date | null = null
  if (range === 'month') {
    startDate = new Date()
    startDate.setMonth(now.getMonth() - 1)
  } else if (range === '30days') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 30)
  }

  let leadsQuery = supabase
    .from('leads')
    .select('id, source, status, created_at, converted_to_client_id')
    .eq('business_id', business.id)
    .not('source', 'is', null)

  if (startDate) {
    leadsQuery = leadsQuery.gte('created_at', startDate.toISOString())
  }

  const { data: leads, error: leadsError } = await leadsQuery

  if (leadsError) {
    throw new Error(`Failed to fetch leads: ${leadsError.message}`)
  }

  const bookedLeads = (leads || []).filter(
    (l: any) => l.status === 'booked' || l.status === 'converted'
  )

  // Map each client -> most recent booked lead source (avoid double counting invoices for the same client)
  const clientToSource = new Map<string, { source: string; created_at: string }>()
  for (const lead of bookedLeads) {
    const clientId = lead.converted_to_client_id
    const source = typeof lead.source === 'string' ? lead.source.trim() : ''
    if (!clientId || !source) continue
    const prev = clientToSource.get(clientId)
    if (!prev || new Date(lead.created_at).getTime() > new Date(prev.created_at).getTime()) {
      clientToSource.set(clientId, { source, created_at: lead.created_at })
    }
  }

  const clientIds = Array.from(clientToSource.keys())
  const invoicesByClient = new Map<string, number>()

  if (clientIds.length > 0) {
    let invoiceQuery = supabase
      .from('invoices')
      .select('client_id, paid_amount, created_at')
      .eq('business_id', business.id)
      .in('client_id', clientIds)

    if (startDate) {
      invoiceQuery = invoiceQuery.gte('created_at', startDate.toISOString())
    }

    const { data: invoices, error: invoiceError } = await invoiceQuery
    if (invoiceError) {
      throw new Error(`Failed to fetch invoices: ${invoiceError.message}`)
    }

    for (const inv of invoices || []) {
      const cid = (inv as any).client_id as string | null
      if (!cid) continue
      const amt = Number((inv as any).paid_amount || 0)
      invoicesByClient.set(cid, (invoicesByClient.get(cid) || 0) + (Number.isFinite(amt) ? amt : 0))
    }
  }

  const bySource = new Map<string, { count: number; revenue: number }>()

  // Count bookings by lead source (booked leads only)
  for (const lead of bookedLeads) {
    const src = typeof lead.source === 'string' ? lead.source.trim() : ''
    if (!src) continue
    const prev = bySource.get(src) || { count: 0, revenue: 0 }
    bySource.set(src, { ...prev, count: prev.count + 1 })
  }

  // Attribute invoice revenue by client->source mapping
  for (const [clientId, meta] of clientToSource.entries()) {
    const revenue = invoicesByClient.get(clientId) || 0
    const prev = bySource.get(meta.source) || { count: 0, revenue: 0 }
    bySource.set(meta.source, { ...prev, revenue: prev.revenue + revenue })
  }

  return Array.from(bySource.entries())
    .map(([source, v]) => ({ source, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
}
