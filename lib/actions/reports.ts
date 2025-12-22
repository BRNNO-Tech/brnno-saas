'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'

export async function getReports(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
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
  
  // Revenue metrics
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('total, paid_amount, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())
  
  const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('total, paid_amount')
    .eq('business_id', businessId)
    .eq('status', 'unpaid')
  
  const outstandingRevenue = unpaidInvoices?.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid_amount || 0)), 0) || 0
  
  const collectionRate = totalRevenue / (totalRevenue + outstandingRevenue) * 100 || 0
  
  // Job metrics
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('status, estimated_cost, estimated_duration')
    .eq('business_id', businessId)
    .gte('created_at', startDate.toISOString())
  
  const totalJobs = allJobs?.length || 0
  const completedJobs = allJobs?.filter(j => j.status === 'completed').length || 0
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
  
  const jobsByStatus = {
    scheduled: allJobs?.filter(j => j.status === 'scheduled').length || 0,
    in_progress: allJobs?.filter(j => j.status === 'in_progress').length || 0,
    completed: completedJobs,
    cancelled: allJobs?.filter(j => j.status === 'cancelled').length || 0,
  }
  
  const avgJobCost = (allJobs?.reduce((sum, j) => sum + (j.estimated_cost || 0), 0) || 0) / (totalJobs || 1) || 0
  const avgJobDuration = (allJobs?.reduce((sum, j) => sum + (j.estimated_duration || 0), 0) || 0) / (totalJobs || 1) || 0
  const totalEstimatedValue = allJobs?.reduce((sum, j) => sum + (j.estimated_cost || 0), 0) || 0
  
  // Client metrics
  const { count: newClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startDate.toISOString())
  
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
  
  // Repeat clients (clients with more than one job)
  const { data: clientJobs } = await supabase
    .from('jobs')
    .select('client_id')
    .eq('business_id', businessId)
    .not('client_id', 'is', null)
  
  const clientJobCounts = clientJobs?.reduce((acc, job) => {
    if (job.client_id) {
      acc[job.client_id] = (acc[job.client_id] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}
  
  const repeatClients = Object.values(clientJobCounts).filter(count => count > 1).length
  
  return {
    timeframe,
    revenue: {
      total: totalRevenue,
      outstanding: outstandingRevenue,
      collectionRate
    },
    jobs: {
      total: totalJobs,
      completed: completedJobs,
      completionRate,
      byStatus: jobsByStatus,
      avgCost: avgJobCost,
      avgDuration: avgJobDuration,
      totalEstimatedValue
    },
    clients: {
      new: newClients || 0,
      repeat: repeatClients,
      total: totalClients || 0
    },
    insights: generateInsights({
      collectionRate,
      completionRate,
      repeatClients,
      totalClients: totalClients || 0
    })
  }
}

function generateInsights(data: {
  collectionRate: number
  completionRate: number
  repeatClients: number
  totalClients: number
}) {
  const insights = []
  
  if (data.collectionRate < 80) {
    insights.push({
      type: 'warning',
      message: `Collection rate is ${data.collectionRate.toFixed(1)}%. Focus on collecting outstanding invoices.`
    })
  } else {
    insights.push({
      type: 'success',
      message: `Great collection rate at ${data.collectionRate.toFixed(1)}%!`
    })
  }
  
  if (data.completionRate > 90) {
    insights.push({
      type: 'success',
      message: `Excellent job completion rate at ${data.completionRate.toFixed(1)}%!`
    })
  } else if (data.completionRate < 70) {
    insights.push({
      type: 'warning',
      message: `Job completion rate is ${data.completionRate.toFixed(1)}%. Review cancelled jobs.`
    })
  }
  
  const repeatRate = data.totalClients > 0 ? (data.repeatClients / data.totalClients) * 100 : 0
  if (repeatRate > 30) {
    insights.push({
      type: 'success',
      message: `${repeatRate.toFixed(1)}% of clients are repeat customers - great retention!`
    })
  } else {
    insights.push({
      type: 'info',
      message: `${repeatRate.toFixed(1)}% repeat customer rate. Consider loyalty programs.`
    })
  }
  
  return insights
}

