import type { SupabaseClient } from '@supabase/supabase-js'
import type { AudienceFilter } from '@/types/marketing'

export type AudienceClient = {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  email_unsubscribed?: boolean | null
}

function hasEmail(c: AudienceClient) {
  return !!(c.email && c.email.trim())
}

function hasPhone(c: AudienceClient) {
  return !!(c.phone && c.phone.trim())
}

/** Filter clients by channel contact availability */
function filterByChannel(clients: AudienceClient[], channel: 'email' | 'sms'): AudienceClient[] {
  if (channel === 'email') return clients.filter(hasEmail)
  return clients.filter(hasPhone)
}

/**
 * Resolve which clients match the audience filter for a campaign channel.
 */
export async function resolveAudienceClients(
  supabase: SupabaseClient,
  businessId: string,
  filter: AudienceFilter,
  channel: 'email' | 'sms'
): Promise<AudienceClient[]> {
  const { data: clientRows, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, email, phone, email_unsubscribed')
    .eq('business_id', businessId)

  if (clientErr) throw clientErr
  let clients: AudienceClient[] = (clientRows || []) as AudienceClient[]

  const all = Boolean(filter.all)
  const lastDays = filter.lastSeenDays
  const serviceType = filter.serviceType?.trim()
  const minSpend = typeof filter.minSpend === 'number' && filter.minSpend > 0 ? filter.minSpend : undefined

  if (!all && (lastDays != null || serviceType || minSpend != null)) {
    const { data: jobs, error: jobErr } = await supabase
      .from('jobs')
      .select('id, client_id, scheduled_date, status, estimated_cost, service_id')
      .eq('business_id', businessId)
      .not('client_id', 'is', null)

    if (jobErr) {
      console.error('[audience] jobs query:', jobErr)
      throw jobErr
    }

    type JobRow = {
      id: string
      client_id: string | null
      scheduled_date: string
      status: string
      estimated_cost: number | null
      service_id: string | null
    }

    const list = (jobs || []) as JobRow[]
    const serviceIds = [...new Set(list.map((j) => j.service_id).filter(Boolean))] as string[]
    const nameByServiceId = new Map<string, string>()
    if (serviceIds.length > 0) {
      const { data: svcRows } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', businessId)
        .in('id', serviceIds)
      for (const s of svcRows || []) {
        if (s.id && s.name) nameByServiceId.set(s.id, s.name)
      }
    }

    const byClient = new Map<
      string,
      { lastJobDate: string; totalSpend: number; serviceNames: Set<string> }
    >()

    for (const j of list) {
      if (!j.client_id) continue
      const cur = byClient.get(j.client_id) || {
        lastJobDate: j.scheduled_date,
        totalSpend: 0,
        serviceNames: new Set<string>(),
      }
      if (j.scheduled_date > cur.lastJobDate) cur.lastJobDate = j.scheduled_date
      if (j.status === 'completed' && j.estimated_cost != null) {
        cur.totalSpend += Number(j.estimated_cost) || 0
      }
      if (j.service_id) {
        const n = nameByServiceId.get(j.service_id)
        if (n) cur.serviceNames.add(n)
      }
      byClient.set(j.client_id, cur)
    }

    const now = new Date()
    const msPerDay = 86400000

    clients = clients.filter((c) => {
      const agg = byClient.get(c.id)
      if (lastDays != null) {
        if (!agg) return true
        const last = new Date(agg.lastJobDate + 'T12:00:00')
        const daysSince = (now.getTime() - last.getTime()) / msPerDay
        return daysSince >= lastDays
      }
      if (serviceType) {
        if (!agg) return false
        return [...agg.serviceNames].some(
          (n) => n.toLowerCase().includes(serviceType.toLowerCase())
        )
      }
      if (minSpend != null) {
        if (!agg) return false
        return agg.totalSpend >= minSpend
      }
      return true
    })
  }

  if (channel === 'email') {
    clients = clients.filter((c) => !c.email_unsubscribed)
  }

  return filterByChannel(clients, channel)
}

export async function countAudience(
  supabase: SupabaseClient,
  businessId: string,
  filter: AudienceFilter,
  channel: 'email' | 'sms'
): Promise<number> {
  const rows = await resolveAudienceClients(supabase, businessId, filter, channel)
  return rows.length
}
