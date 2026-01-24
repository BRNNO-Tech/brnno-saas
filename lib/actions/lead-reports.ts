'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface ChannelConversionData {
  channel: string
  sent: number
  replied: number
  booked: number
  revenue: number
}

export interface FunnelData {
  stage: string
  count: number
  percentage: number
}

export interface SequenceROI {
  sequence_id: string
  sequence_name: string
  enrollments: number
  bookings: number
  revenue: number
  roi: number
}

export interface ReportsData {
  recoveredRevenue30d: number
  recoveredRevenueTrend: number
  revenueOverTime: RevenueDataPoint[]
  channelConversions: ChannelConversionData[]
  funnelData: FunnelData[]
  topSequences: SequenceROI[]
  speedToLeadDistribution: Array<{ range: string; count: number }>
}

function isTableMissingError(error: any): boolean {
  return error?.code === '42P01' || 
         error?.message?.toLowerCase().includes('does not exist') ||
         error?.message?.toLowerCase().includes('relation') ||
         error?.message?.toLowerCase().includes('table')
}

export async function getLeadReportsData(days: number = 30): Promise<ReportsData> {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    // Return mock reports data
    return {
      recoveredRevenue30d: 1249.97,
      recoveredRevenueTrend: 15.5,
      revenueOverTime: [
        { date: '2024-01-01', revenue: 299.99 },
        { date: '2024-01-02', revenue: 89.99 },
        { date: '2024-01-03', revenue: 149.99 },
        { date: '2024-01-04', revenue: 299.99 },
        { date: '2024-01-05', revenue: 410.01 },
      ],
      channelConversions: [
        { channel: 'online_booking', sent: 2, replied: 1, booked: 1, revenue: 299.99 },
        { channel: 'referral', sent: 1, replied: 0, booked: 0, revenue: 0 },
        { channel: 'website', sent: 1, replied: 0, booked: 0, revenue: 0 },
      ],
      funnelData: [
        { stage: 'New Leads', count: 2, percentage: 100 },
        { stage: 'Contacted', count: 2, percentage: 100 },
        { stage: 'Quoted', count: 1, percentage: 50 },
        { stage: 'Booked', count: 1, percentage: 50 },
      ],
      topSequences: [],
      speedToLeadDistribution: [
        { range: '0-1h', count: 1 },
        { range: '1-24h', count: 1 },
        { range: '24h+', count: 0 },
      ],
    }
  }

  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    // Get all leads and interactions for the business
    let leads: any[] = []
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at, estimated_value, source')
      .eq('business_id', businessId)
      .gte('created_at', startDateStr)

    if (leadsError) {
      if (isTableMissingError(leadsError)) {
        console.warn('Leads table does not exist. Reports will show empty data.')
      } else {
        console.error('Error fetching leads:', leadsError)
      }
    } else {
      leads = leadsData || []
    }

    // Get interactions (handle empty leads array)
    let interactions: any[] = []
    if (leads.length > 0) {
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('lead_interactions')
        .select('id, lead_id, type, direction, created_at, outcome')
        .in('lead_id', leads.map(l => l.id))
        .gte('created_at', startDateStr)

      if (interactionsError) {
        if (isTableMissingError(interactionsError)) {
          console.warn('Lead interactions table does not exist.')
        } else {
          console.error('Error fetching interactions:', interactionsError)
        }
      } else {
        interactions = interactionsData || []
      }
    }

    // Get jobs/bookings from leads
    let jobs: any[] = []
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, lead_id, estimated_cost, scheduled_date')
      .eq('business_id', businessId)
      .gte('scheduled_date', startDateStr)

    if (jobsError) {
      if (isTableMissingError(jobsError)) {
        console.warn('Jobs table does not exist. Revenue calculations may be incomplete.')
      } else {
        console.error('Error fetching jobs:', jobsError)
      }
    } else {
      jobs = jobsData || []
    }

    // Calculate recovered revenue (booked leads that were recovered)
    const bookedLeads = leads.filter(l => l.status === 'booked')
    const recoveredRevenue30d = bookedLeads.reduce((sum, lead) => {
      const job = jobs.find(j => j.lead_id === lead.id)
      return sum + (job?.estimated_cost || lead.estimated_value || 0)
    }, 0)

    // Calculate trend (compare to previous period)
    let prevRevenue = 0
    try {
      const prevStartDate = new Date()
      prevStartDate.setDate(prevStartDate.getDate() - (days * 2))
      const prevEndDate = new Date()
      prevEndDate.setDate(prevEndDate.getDate() - days)

      const { data: prevLeads, error: prevLeadsError } = await supabase
        .from('leads')
        .select('id, status, estimated_value')
        .eq('business_id', businessId)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', prevEndDate.toISOString())

      if (!prevLeadsError && prevLeads) {
        const prevBookedLeads = prevLeads.filter(l => l.status === 'booked')
        prevRevenue = prevBookedLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)
      }
    } catch (error) {
      // Silently fail trend calculation
    }

    const recoveredRevenueTrend = prevRevenue > 0
      ? ((recoveredRevenue30d - prevRevenue) / prevRevenue) * 100
      : 0

    // Revenue over time (daily)
    const revenueOverTime: RevenueDataPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLeads = bookedLeads.filter(l => {
        const leadDate = new Date(l.created_at).toISOString().split('T')[0]
        return leadDate === dateStr
      })

      const dayRevenue = dayLeads.reduce((sum, lead) => {
        const job = jobs?.find(j => j.lead_id === lead.id)
        return sum + (job?.estimated_cost || lead.estimated_value || 0)
      }, 0)

      revenueOverTime.push({
        date: dateStr,
        revenue: dayRevenue,
      })
    }

    // Channel conversions
    const smsInteractions = interactions.filter(i => i.type === 'sms' || i.type === 'text')
    const emailInteractions = interactions.filter(i => i.type === 'email')
    
    const smsReplied = smsInteractions.filter(i => i.direction === 'inbound').length
    const emailReplied = emailInteractions.filter(i => i.direction === 'inbound').length

    // Get bookings from SMS/Email leads
    const smsLeads = leads.filter(l => {
      const hasSms = smsInteractions.some(i => i.lead_id === l.id)
      return hasSms && l.status === 'booked'
    })
    const emailLeads = leads.filter(l => {
      const hasEmail = emailInteractions.some(i => i.lead_id === l.id)
      return hasEmail && l.status === 'booked'
    })

    const smsRevenue = smsLeads.reduce((sum, lead) => {
      const job = jobs.find(j => j.lead_id === lead.id)
      return sum + (job?.estimated_cost || lead.estimated_value || 0)
    }, 0)

    const emailRevenue = emailLeads.reduce((sum, lead) => {
      const job = jobs.find(j => j.lead_id === lead.id)
      return sum + (job?.estimated_cost || lead.estimated_value || 0)
    }, 0)

    const channelConversions: ChannelConversionData[] = [
      {
        channel: 'SMS',
        sent: smsInteractions.filter(i => i.direction === 'outbound').length,
        replied: smsReplied,
        booked: smsLeads.length,
        revenue: smsRevenue,
      },
      {
        channel: 'Email',
        sent: emailInteractions.filter(i => i.direction === 'outbound').length,
        replied: emailReplied,
        booked: emailLeads.length,
        revenue: emailRevenue,
      },
    ]

    // Funnel data
    const totalLeads = leads.length
    const repliedLeads = new Set(
      interactions.filter(i => i.direction === 'inbound').map(i => i.lead_id)
    ).size
    const engagedLeads = leads.filter(l => l.status === 'in_progress' || l.status === 'quoted').length
    const bookedCount = bookedLeads.length

    const funnelData: FunnelData[] = [
      { stage: 'Leads', count: totalLeads, percentage: 100 },
      { stage: 'Replied', count: repliedLeads, percentage: totalLeads > 0 ? (repliedLeads / totalLeads) * 100 : 0 },
      { stage: 'Engaged', count: engagedLeads, percentage: totalLeads > 0 ? (engagedLeads / totalLeads) * 100 : 0 },
      { stage: 'Booked', count: bookedCount, percentage: totalLeads > 0 ? (bookedCount / totalLeads) * 100 : 0 },
    ]

    // Top sequences by ROI (handle missing tables gracefully)
    let topSequences: SequenceROI[] = []
    try {
      const { data: sequences, error: sequencesError } = await supabase
        .from('sequences')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('enabled', true)

      if (sequencesError) {
        if (isTableMissingError(sequencesError)) {
          console.warn('Sequences table does not exist. Top sequences will be empty.')
        } else {
          console.error('Error fetching sequences:', sequencesError)
        }
      } else if (sequences && sequences.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('sequence_enrollments')
          .select('sequence_id, lead_id, status')
          .in('sequence_id', sequences.map(s => s.id))

        if (enrollmentsError) {
          if (isTableMissingError(enrollmentsError)) {
            console.warn('Sequence enrollments table does not exist.')
          } else {
            console.error('Error fetching enrollments:', enrollmentsError)
          }
        } else {
          const enrollmentsList = enrollments || []
          topSequences = sequences.map(seq => {
            const seqEnrollments = enrollmentsList.filter(e => e.sequence_id === seq.id)
            const seqBookings = seqEnrollments.filter(e => {
              const lead = leads.find(l => l.id === e.lead_id)
              return lead?.status === 'booked'
            }).length

            const seqRevenue = seqEnrollments
              .filter(e => {
                const lead = leads.find(l => l.id === e.lead_id)
                return lead?.status === 'booked'
              })
              .reduce((sum, e) => {
                const lead = leads.find(l => l.id === e.lead_id)
                const job = jobs.find(j => j.lead_id === e.lead_id)
                return sum + (job?.estimated_cost || lead?.estimated_value || 0)
              }, 0)

            return {
              sequence_id: seq.id,
              sequence_name: seq.name,
              enrollments: seqEnrollments.length,
              bookings: seqBookings,
              revenue: seqRevenue,
              roi: seqEnrollments.length > 0 ? (seqRevenue / seqEnrollments.length) : 0,
            }
          }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
        }
      }
    } catch (error) {
      // Silently fail sequences calculation
      console.warn('Error calculating top sequences:', error)
    }

    // Speed-to-lead distribution (time from lead creation to first contact)
    const speedDistribution: Array<{ range: string; count: number }> = [
      { range: '< 5 min', count: 0 },
      { range: '5-15 min', count: 0 },
      { range: '15-30 min', count: 0 },
      { range: '30-60 min', count: 0 },
      { range: '1-4 hours', count: 0 },
      { range: '4-24 hours', count: 0 },
      { range: '> 24 hours', count: 0 },
    ]

    leads.forEach(lead => {
      const firstContact = interactions
        .filter(i => i.lead_id === lead.id && i.direction === 'outbound')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

      if (firstContact) {
        const leadCreated = new Date(lead.created_at)
        const firstContactTime = new Date(firstContact.created_at)
        const diffMinutes = (firstContactTime.getTime() - leadCreated.getTime()) / (1000 * 60)

        if (diffMinutes < 5) speedDistribution[0].count++
        else if (diffMinutes < 15) speedDistribution[1].count++
        else if (diffMinutes < 30) speedDistribution[2].count++
        else if (diffMinutes < 60) speedDistribution[3].count++
        else if (diffMinutes < 240) speedDistribution[4].count++
        else if (diffMinutes < 1440) speedDistribution[5].count++
        else speedDistribution[6].count++
      } else {
        speedDistribution[6].count++ // No contact = > 24 hours
      }
    })

    return {
      recoveredRevenue30d,
      recoveredRevenueTrend,
      revenueOverTime,
      channelConversions,
      funnelData,
      topSequences,
      speedToLeadDistribution: speedDistribution,
    }
  } catch (error) {
    // Only log meaningful errors
    if (error instanceof Error && error.message) {
      console.error('Error fetching reports data:', error.message)
    } else if (typeof error === 'object' && error !== null && Object.keys(error).length > 0) {
      console.error('Error fetching reports data:', error)
    }
    // Return empty data structure on error
    return {
      recoveredRevenue30d: 0,
      recoveredRevenueTrend: 0,
      revenueOverTime: [],
      channelConversions: [],
      funnelData: [],
      topSequences: [],
      speedToLeadDistribution: [],
    }
  }
}
