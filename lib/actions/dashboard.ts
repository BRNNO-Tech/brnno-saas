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

