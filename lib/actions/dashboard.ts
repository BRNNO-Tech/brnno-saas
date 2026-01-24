'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockDashboardStats } from '@/lib/demo/mock-data'

export async function getDashboardStats() {
  if (await isDemoMode()) {
    return getMockDashboardStats()
  }

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
  // Use payments table for accurate payment dates, or invoices created this month if no payment record
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  // Get payments made this month
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, created_at, invoice_id')
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString())
  
  // Get invoices created this month that are paid but might not have a payment record (e.g., online bookings)
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('total, created_at, id')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startOfMonth.toISOString())
  
  // Calculate revenue from payments
  const revenueFromPayments = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  
  // Calculate revenue from invoices that don't have payment records (avoid double counting)
  const invoiceIdsWithPayments = new Set(payments?.map(p => p.invoice_id) || [])
  const revenueFromInvoices = paidInvoices
    ?.filter(inv => !invoiceIdsWithPayments.has(inv.id))
    .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  
  const revenueMTD = revenueFromPayments + revenueFromInvoices
  
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
  if (await isDemoMode()) {
    // Return mock monthly revenue data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    return [
      { name: monthNames[(now.getMonth() - 5 + 12) % 12], total: 1249.97 },
      { name: monthNames[(now.getMonth() - 4 + 12) % 12], total: 1529.96 },
      { name: monthNames[(now.getMonth() - 3 + 12) % 12], total: 1389.98 },
      { name: monthNames[(now.getMonth() - 2 + 12) % 12], total: 1679.95 },
      { name: monthNames[(now.getMonth() - 1 + 12) % 12], total: 1429.97 },
      { name: monthNames[now.getMonth()], total: 1029.98 },
    ]
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get last 6 months of paid invoices (same approach as reports)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)
  
  const { data: paidInvoices, error } = await supabase
    .from('invoices')
    .select('total, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Group by month
  const monthlyData: Record<string, number> = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${monthNames[date.getMonth()]}`
    monthlyData[monthKey] = 0
  }
  
  // Sum revenue by month
  paidInvoices?.forEach(invoice => {
    const date = new Date(invoice.created_at)
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

export async function getUpcomingJobs() {
  if (await isDemoMode()) {
    return [
      {
        id: 'demo-1',
        title: 'Interior Detail',
        client: { name: 'Mia T.' },
        scheduled_date: new Date().toISOString(),
        status: 'scheduled',
        service_type: 'Interior',
      },
      {
        id: 'demo-2',
        title: 'Full Detail',
        client: { name: 'Ken S.' },
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        status: 'confirmed',
        service_type: 'Full Detail',
      },
    ]
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      scheduled_date,
      status,
      service_type,
      client:clients(name)
    `)
    .eq('business_id', businessId)
    .in('status', ['scheduled', 'in_progress', 'confirmed'])
    .gte('scheduled_date', today.toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(5)
  
  if (error) throw error
  return jobs || []
}

export async function getUnpaidInvoices() {
  if (await isDemoMode()) {
    return [
      {
        id: 'INV-2200',
        invoice_number: 'INV-2200',
        total: 120,
        status: 'unpaid',
        due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        client: { name: 'Ava R.' },
      },
      {
        id: 'INV-2199',
        invoice_number: 'INV-2199',
        total: 180,
        status: 'overdue',
        due_date: new Date(Date.now() - 86400000).toISOString(),
        client: { name: 'Mia T.' },
      },
    ]
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total,
      status,
      due_date,
      created_at,
      client:clients(name)
    `)
    .eq('business_id', businessId)
    .in('status', ['unpaid', 'overdue'])
    .order('due_date', { ascending: true })
    .limit(5)
  
  if (error) throw error
  
  // Mark invoices as overdue if due_date has passed
  const now = new Date()
  return (invoices || []).map(inv => ({
    ...inv,
    status: inv.due_date && new Date(inv.due_date) < now ? 'overdue' : inv.status,
  }))
}

