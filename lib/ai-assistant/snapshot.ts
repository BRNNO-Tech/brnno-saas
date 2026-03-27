import type { SupabaseClient } from '@supabase/supabase-js'
import {
  MOCK_BUSINESS,
  MOCK_CLIENTS,
  MOCK_JOBS,
  MOCK_LEADS,
  getMockDashboardStats,
  getMockInvoices,
} from '@/lib/demo/mock-data'

export type UpcomingJobLine = {
  id: string
  clientName: string
  service: string
  title: string
  scheduledAt: string
}

export type UnreadLeadLine = {
  id: string
  name: string
  serviceInterest: string
  createdAt: string
}

/** Same shape as unread lines; score = 'hot' (dashboard red emphasis). */
export type HotLeadLine = UnreadLeadLine

/** Leads with pipeline status = 'new' (may already be viewed). */
export type NewLeadLine = UnreadLeadLine

export type AssistantSnapshot = {
  businessName: string
  /** Jobs completed this month (same metric as dashboard stats). */
  jobsCompletedThisMonth: number
  revenueMTD: number
  monthlyRevenueSeries: Array<{ name: string; total: number }>
  unpaidInvoiceCount: number
  unpaidInvoiceTotal: number
  upcomingJobs: UpcomingJobLine[]
  newLeads: NewLeadLine[]
  unreadLeads: UnreadLeadLine[]
  hotLeads: HotLeadLine[]
  clientCount: number
  clientsSample: Array<{ id: string; name: string; email: string | null; phone: string | null }>
}

function formatMoney(n: number): string {
  return n.toFixed(2)
}

function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Demo snapshot — mirrors dashboard mock data without hitting the DB. */
export function buildDemoAssistantSnapshot(): AssistantSnapshot {
  const stats = getMockDashboardStats()
  const invoices = getMockInvoices()
  const unpaid = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue')
  const unpaidTotal = unpaid.reduce((s, i) => s + (i.total || 0), 0)

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const upcoming = MOCK_JOBS.filter((j) => {
    if (!['scheduled', 'in_progress', 'confirmed'].includes(j.status)) return false
    const t = new Date(j.scheduled_date).getTime()
    return t >= todayStart.getTime() && t <= weekEnd.getTime()
  })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .map((j) => {
      const client = MOCK_CLIENTS.find((c) => c.id === j.client_id)
      return {
        id: j.id,
        clientName: client?.name ?? 'Unknown',
        service: j.service_type || j.title,
        title: j.title,
        scheduledAt: j.scheduled_date,
      }
    })

  const newLeads: NewLeadLine[] = MOCK_LEADS.filter((l) => l.status === 'new')
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: l.name,
      serviceInterest: l.interested_in_service_name || '—',
      createdAt: l.created_at,
    }))

  const unreadLeads: UnreadLeadLine[] = MOCK_LEADS.filter(
    (l) => l.status !== 'lost' && l.status !== 'booked'
  )
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: l.name,
      serviceInterest: l.interested_in_service_name || '—',
      createdAt: l.created_at,
    }))

  const hotLeads: HotLeadLine[] = MOCK_LEADS.filter(
    (l) => l.score === 'hot' && l.status !== 'lost' && l.status !== 'booked'
  )
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: l.name,
      serviceInterest: l.interested_in_service_name || '—',
      createdAt: l.created_at,
    }))

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d0 = new Date()
  const monthlyRevenueSeries = [5, 4, 3, 2, 1, 0].map((i) => {
    const d = new Date(d0.getFullYear(), d0.getMonth() - i, 1)
    return { name: monthNames[d.getMonth()], total: 1000 + i * 120 }
  })

  return {
    businessName: MOCK_BUSINESS.name,
    jobsCompletedThisMonth: stats.jobsCompletedThisMonth,
    revenueMTD: stats.revenueMTD,
    monthlyRevenueSeries,
    unpaidInvoiceCount: unpaid.length,
    unpaidInvoiceTotal: unpaidTotal,
    upcomingJobs: upcoming,
    newLeads,
    unreadLeads,
    hotLeads,
    clientCount: MOCK_CLIENTS.length,
    clientsSample: MOCK_CLIENTS.slice(0, 50).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email ?? null,
      phone: c.phone ?? null,
    })),
  }
}

/**
 * Loads read-only business context using the service-role Supabase client.
 * Caller must have already verified the business id belongs to the signed-in owner (or demo).
 */
export async function fetchAssistantSnapshot(
  supabase: SupabaseClient,
  businessId: string
): Promise<AssistantSnapshot> {
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .single()

  if (bizErr || !biz?.name) {
    throw new Error('Business not found')
  }

  const startMonth = startOfMonth(new Date())
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(todayStart)
  windowEnd.setDate(windowEnd.getDate() + 7)
  windowEnd.setHours(23, 59, 59, 999)

  const [
    { count: totalClients },
    { count: jobsCompletedThisMonth },
    { data: payments, error: payErr },
    { data: paidInvoicesThisMonth, error: paidInvErr },
    { data: paidInvoices6m, error: paid6Err },
    { data: unpaidRows, error: unpaidErr },
    { data: jobRows, error: jobErr },
    { data: leadRows, error: leadErr },
    { data: hotLeadRows, error: hotLeadErr },
    { data: newLeadRows, error: newLeadErr },
    { data: clientRows, error: clientErr },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('updated_at', startMonth.toISOString()),
    supabase
      .from('payments')
      .select('amount, created_at, invoice_id')
      .eq('business_id', businessId)
      .gte('created_at', startMonth.toISOString()),
    supabase
      .from('invoices')
      .select('total, created_at, id')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('created_at', startMonth.toISOString()),
    supabase
      .from('invoices')
      .select('total, created_at')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('invoices')
      .select('id, total, status, created_at')
      .eq('business_id', businessId)
      .in('status', ['unpaid', 'overdue']),
    supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        scheduled_date,
        status,
        service_type,
        client:clients(name)
      `
      )
      .eq('business_id', businessId)
      .in('status', ['scheduled', 'in_progress', 'confirmed'])
      .gte('scheduled_date', todayStart.toISOString())
      .lte('scheduled_date', windowEnd.toISOString())
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('leads')
      .select('id, name, created_at, status, viewed_at, interested_in_service_name')
      .eq('business_id', businessId)
      .is('viewed_at', null)
      .neq('status', 'lost')
      .neq('status', 'booked')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('leads')
      .select('id, name, created_at, status, score, interested_in_service_name')
      .eq('business_id', businessId)
      .eq('score', 'hot')
      .neq('status', 'lost')
      .neq('status', 'booked')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('leads')
      .select('id, name, created_at, status, score, interested_in_service_name')
      .eq('business_id', businessId)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (payErr) console.error('[ai-assistant] payments:', payErr.message)
  if (paidInvErr) console.error('[ai-assistant] paid invoices MTD:', paidInvErr.message)
  if (paid6Err) console.error('[ai-assistant] paid invoices 6m:', paid6Err.message)
  if (unpaidErr) console.error('[ai-assistant] unpaid:', unpaidErr.message)
  if (jobErr) console.error('[ai-assistant] jobs:', jobErr.message)
  if (leadErr) console.error('[ai-assistant] leads (unread):', leadErr.message)
  if (hotLeadErr) console.error('[ai-assistant] leads (hot):', hotLeadErr.message)
  if (newLeadErr) console.error('[ai-assistant] leads (new):', newLeadErr.message)
  if (clientErr) console.error('[ai-assistant] clients:', clientErr.message)

  const invoiceIdsWithPayments = new Set((payments ?? []).map((p) => p.invoice_id).filter(Boolean))
  const revenueFromPayments = (payments ?? []).reduce((s, p) => s + (p.amount || 0), 0)
  const revenueFromInvoices =
    (paidInvoicesThisMonth ?? [])
      .filter((inv) => !invoiceIdsWithPayments.has(inv.id))
      .reduce((s, inv) => s + (inv.total || 0), 0) || 0
  const revenueMTD = revenueFromPayments + revenueFromInvoices

  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyData[monthNames[date.getMonth()]] = 0
  }
  for (const invoice of paidInvoices6m ?? []) {
    const d = new Date(invoice.created_at)
    const key = monthNames[d.getMonth()]
    if (Object.prototype.hasOwnProperty.call(monthlyData, key)) {
      monthlyData[key] += invoice.total || 0
    }
  }
  const monthlyRevenueSeries = Object.entries(monthlyData).map(([name, total]) => ({
    name,
    total: Math.round(total * 100) / 100,
  }))

  const unpaidList = unpaidRows ?? []
  const unpaidInvoiceTotal = unpaidList.reduce((s, inv) => s + (inv.total || 0), 0)

  const upcomingJobs: UpcomingJobLine[] = (jobRows ?? []).map((row: any) => {
    const client = row.client
    const clientName = Array.isArray(client) ? client[0]?.name : client?.name
    return {
      id: row.id,
      clientName: clientName || 'Unknown',
      service: row.service_type || row.title || '—',
      title: row.title || '—',
      scheduledAt: row.scheduled_date,
    }
  })

  const unreadLeads: UnreadLeadLine[] = (leadRows ?? []).map((row: any) => ({
    id: row.id,
    name: row.name || '—',
    serviceInterest: row.interested_in_service_name || '—',
    createdAt: row.created_at,
  }))

  const hotLeads: HotLeadLine[] = (hotLeadRows ?? []).map((row: any) => ({
    id: row.id,
    name: row.name || '—',
    serviceInterest: row.interested_in_service_name || '—',
    createdAt: row.created_at,
  }))

  const newLeads: NewLeadLine[] = (newLeadRows ?? []).map((row: any) => ({
    id: row.id,
    name: row.name || '—',
    serviceInterest: row.interested_in_service_name || '—',
    createdAt: row.created_at,
  }))

  return {
    businessName: biz.name,
    jobsCompletedThisMonth: jobsCompletedThisMonth ?? 0,
    revenueMTD,
    monthlyRevenueSeries,
    unpaidInvoiceCount: unpaidList.length,
    unpaidInvoiceTotal,
    upcomingJobs,
    newLeads,
    unreadLeads,
    hotLeads,
    clientCount: totalClients ?? 0,
    clientsSample: (clientRows ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email ?? null,
      phone: c.phone ?? null,
    })),
  }
}

export function buildSystemPrompt(snapshot: AssistantSnapshot): string {
  const upcomingLines =
    snapshot.upcomingJobs.length === 0
      ? 'None in the next 7 days.'
      : snapshot.upcomingJobs
          .map((j) => {
            const when = j.scheduledAt
              ? new Date(j.scheduledAt).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : '—'
            return `- ${j.clientName}: ${j.service} — ${when}`
          })
          .join('\n')

  const unreadLeadLines =
    snapshot.unreadLeads.length === 0
      ? 'None.'
      : snapshot.unreadLeads
          .map((l) => {
            const when = new Date(l.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
            return `- ${l.name} (${l.serviceInterest}) — ${when}`
          })
          .join('\n')

  const hotLeadSummary =
    snapshot.hotLeads.length === 0
      ? 'None.'
      : snapshot.hotLeads.map((l) => `${l.name} (${l.serviceInterest})`).join('; ')

  const newLeadSummary =
    snapshot.newLeads.length === 0
      ? 'None.'
      : snapshot.newLeads.map((l) => `${l.name} (${l.serviceInterest})`).join('; ')

  const clientsPreview =
    snapshot.clientsSample.length === 0
      ? 'None on file.'
      : snapshot.clientsSample
          .slice(0, 15)
          .map((c) => `- ${c.name}`)
          .join('\n')

  const monthlySeriesText = snapshot.monthlyRevenueSeries
    .map((m) => `${m.name}: $${formatMoney(m.total)}`)
    .join(', ')

  return `You are an AI business assistant for ${snapshot.businessName}, a mobile detailing business.
You help the detailer manage their business by answering questions about their jobs,
clients, invoices, leads, and revenue.

Current business snapshot:
- Jobs completed this month: ${snapshot.jobsCompletedThisMonth}
- Month-to-date revenue: $${formatMoney(snapshot.revenueMTD)}
- Recent monthly revenue by month (paid invoices, last 6 months in chart): ${monthlySeriesText}
- Unpaid / overdue invoices: ${snapshot.unpaidInvoiceCount} totaling $${formatMoney(snapshot.unpaidInvoiceTotal)}
- Upcoming jobs (next 7 days):
${upcomingLines}
- New leads (status = new): ${snapshot.newLeads.length}${newLeadSummary === 'None.' ? '' : ` — ${newLeadSummary}`}
- Unread leads (viewed_at is null; not opened in app yet): ${snapshot.unreadLeads.length}
${unreadLeadLines}
- Hot leads (score = hot; often shown in red on dashboard): ${snapshot.hotLeads.length}${hotLeadSummary === 'None.' ? '' : ` — ${hotLeadSummary}`}
- Total active clients: ${snapshot.clientCount}
- Client names (sample):
${clientsPreview}

Answer questions conversationally and concisely. You are read-only — do not
tell the detailer you can create or modify anything. If they ask you to do
something, tell them that's coming soon and direct them to the relevant
dashboard section (e.g. Jobs, Invoices, Leads, Customers, Calendar).`
}

export function buildBootstrapGreeting(snapshot: AssistantSnapshot): string {
  const parts: string[] = []
  parts.push(`Hey! Here's a quick snapshot for ${snapshot.businessName}.`)

  if (snapshot.upcomingJobs.length > 0) {
    parts.push(
      `You have ${snapshot.upcomingJobs.length} upcoming job${snapshot.upcomingJobs.length === 1 ? '' : 's'} in the next 7 days.`
    )
  } else {
    parts.push(`No jobs scheduled in the next 7 days.`)
  }

  if (snapshot.unpaidInvoiceCount > 0) {
    parts.push(
      `${snapshot.unpaidInvoiceCount} unpaid invoice${snapshot.unpaidInvoiceCount === 1 ? '' : 's'} totaling $${formatMoney(snapshot.unpaidInvoiceTotal)}.`
    )
  } else {
    parts.push(`You're all caught up on unpaid invoices.`)
  }

  if (snapshot.newLeads.length > 0) {
    parts.push(
      `You have ${snapshot.newLeads.length} new lead${snapshot.newLeads.length === 1 ? '' : 's'} to review.`
    )
  }

  if (snapshot.unreadLeads.length > 0) {
    parts.push(`${snapshot.unreadLeads.length} unread lead${snapshot.unreadLeads.length === 1 ? '' : 's'} waiting for you.`)
  }

  if (snapshot.hotLeads.length > 0) {
    parts.push(
      `You have ${snapshot.hotLeads.length} hot lead${snapshot.hotLeads.length === 1 ? '' : 's'} worth following up on.`
    )
  }

  parts.push(`Month-to-date revenue is $${formatMoney(snapshot.revenueMTD)} with ${snapshot.clientCount} clients on file.`)
  parts.push(`What can I help you with?`)

  return parts.join(' ')
}
