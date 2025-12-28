'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'

export async function getDashboardStats() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get total clients
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
  
  // Get active jobs (scheduled or in_progress)
  const { count: activeJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['scheduled', 'in_progress'])
  
  // Get pending invoices (unpaid)
  const { count: pendingInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'unpaid')
  
  // Get month-to-date revenue
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('total')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('updated_at', startOfMonth.toISOString())
  
  const revenueMTD = paidInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  
  // Get recent activity (last 10 completed jobs, paid invoices, new clients)
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, title, updated_at, status')
    .eq('business_id', businessId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(5)
  
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, total, updated_at, status, client:clients(name)')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .order('updated_at', { ascending: false })
    .limit(5)
  
  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Combine and sort recent activity
  const recentActivity = [
    ...(recentJobs?.map(j => ({ type: 'job', ...j, date: j.updated_at })) || []),
    ...(recentInvoices?.map(i => ({ type: 'invoice', ...i, date: i.updated_at })) || []),
    ...(recentClients?.map(c => ({ type: 'client', ...c, date: c.created_at })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  
  return {
    totalClients: totalClients || 0,
    activeJobs: activeJobs || 0,
    pendingInvoices: pendingInvoices || 0,
    revenueMTD,
    recentActivity
  }
}

export async function getMonthlyRevenue() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get last 6 months of paid invoices
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)
  
  const { data: paidInvoices, error } = await supabase
    .from('invoices')
    .select('total, updated_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('updated_at', sixMonthsAgo.toISOString())
    .order('updated_at', { ascending: true })
  
  if (error) throw error
  
  // Group by month
  const monthlyData: Record<string, number> = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Initialize last 6 months with 0
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${monthNames[date.getMonth()]}`
    monthlyData[monthKey] = 0
  }
  
  // Sum revenue by month
  paidInvoices?.forEach(invoice => {
    const date = new Date(invoice.updated_at)
    const monthKey = `${monthNames[date.getMonth()]}`
    if (monthlyData.hasOwnProperty(monthKey)) {
      monthlyData[monthKey] += invoice.total || 0
    }
  })
  
  // Convert to array format for chart
  return Object.entries(monthlyData).map(([name, total]) => ({
    name,
    total: Math.round(total * 100) / 100 // Round to 2 decimals
  }))
}

