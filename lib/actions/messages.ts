'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceRoleClient } from '@/lib/supabase/service-client'
import { getBusinessId } from './utils'

/**
 * Send an outbound message as the business (dashboard → lead).
 * Inserts into messages with sender_type: 'business'. Does not send SMS here;
 * callers may trigger SMS separately if needed.
 */
export async function sendMessage(leadId: string, body: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      business_id: businessId,
      lead_id: leadId,
      body,
      direction: 'outbound',
      sender_type: 'business',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * One conversation (thread) for the messages inbox list.
 */
export type ConversationRow = {
  lead_id: string
  last_message_at: string
  leadName: string
  lastPreview: string
}

/**
 * Get all conversations (threads) for the current business.
 * Returns every lead_id that has at least one message — inbound-only, outbound-only, and mixed.
 * Filters only by business_id (no direction/sender_type filter) so customer-portal-inserted messages are included.
 */
export async function getConversations(): Promise<ConversationRow[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('messages')
    .select('lead_id, created_at, body, lead:leads(name)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as Array<{
    lead_id: string
    created_at: string
    body: string | null
    lead: { name: string | null } | Array<{ name: string | null }> | null
  }>
  const byLead = new Map<string, { last_message_at: string; body: string | null; leadName: string }>()
  for (const r of rows) {
    if (!r.lead_id || byLead.has(r.lead_id)) continue
    const lead = Array.isArray(r.lead) ? r.lead[0] : r.lead
    const leadName = lead?.name ?? 'Unknown'
    byLead.set(r.lead_id, {
      last_message_at: r.created_at,
      body: r.body ?? null,
      leadName,
    })
  }
  return Array.from(byLead.entries()).map(([lead_id, { last_message_at, body, leadName }]) => ({
    lead_id,
    last_message_at,
    leadName,
    lastPreview: body ? (body.length > 60 ? `${body.slice(0, 60)}…` : body) : '',
  }))
}

/**
 * Get conversations for a given business (e.g. for worker app).
 * Uses service role so team members can list conversations for their business.
 */
export async function getConversationsForBusiness(businessId: string): Promise<ConversationRow[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('messages')
    .select('lead_id, created_at, body, lead:leads(name)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as Array<{
    lead_id: string
    created_at: string
    body: string | null
    lead: { name: string | null } | Array<{ name: string | null }> | null
  }>
  const byLead = new Map<string, { last_message_at: string; body: string | null; leadName: string }>()
  for (const r of rows) {
    if (!r.lead_id || byLead.has(r.lead_id)) continue
    const lead = Array.isArray(r.lead) ? r.lead[0] : r.lead
    const leadName = lead?.name ?? 'Unknown'
    byLead.set(r.lead_id, {
      last_message_at: r.created_at,
      body: r.body ?? null,
      leadName,
    })
  }
  return Array.from(byLead.entries()).map(([lead_id, { last_message_at, body, leadName }]) => ({
    lead_id,
    last_message_at,
    leadName,
    lastPreview: body ? (body.length > 60 ? `${body.slice(0, 60)}…` : body) : '',
  }))
}

/**
 * Send an outbound message as a team member (worker app).
 * Uses service role so worker RLS does not block the insert.
 * Returns the new message.
 */
export async function sendMessageAsWorker(
  teamMemberId: string,
  businessId: string,
  leadId: string,
  body: string
) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      direction: 'outbound',
      sender_type: 'team_member',
      team_member_id: teamMemberId,
      business_id: businessId,
      lead_id: leadId,
      body,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Message row with optional team_member for dashboard inbox */
export type MessageWithSender = {
  id: string
  business_id: string
  lead_id: string
  body: string
  direction: string
  created_at: string
  sender_type: string | null
  team_member_id: string | null
  customer_id: string | null
  team_member?: { name: string | null } | null
}

/**
 * Get all messages for a lead thread. Returns sender_type, team_member_id,
 * customer_id, and team_member name for attribution.
 * When useServiceRole is true (e.g. customer portal), uses service role client for the query.
 */
export async function getMessagesForLead(leadId: string, useServiceRole?: boolean): Promise<MessageWithSender[]> {
  let supabase: Awaited<ReturnType<typeof createClient>>
  let businessId: string

  if (useServiceRole) {
    const serviceSupabase = createServiceRoleClient()
    const { data: lead, error: leadErr } = await serviceSupabase
      .from('leads')
      .select('business_id')
      .eq('id', leadId)
      .single()
    if (leadErr || !lead?.business_id) throw new Error('Lead not found')
    businessId = lead.business_id
    supabase = serviceSupabase
  } else {
    supabase = await createClient()
    businessId = await getBusinessId()
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, business_id, lead_id, body, direction, created_at, sender_type, team_member_id, customer_id, team_member:team_members(name)')
    .eq('lead_id', leadId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const rows = data ?? []
  return rows.map((r: Record<string, unknown>) => ({
    ...r,
    team_member: Array.isArray(r.team_member) ? r.team_member[0] : r.team_member,
  })) as MessageWithSender[]
}

/**
 * Save an in-app message as sent by the customer (no SMS).
 * Finds the business from the lead (via service role to avoid RLS) and inserts with sender_type: 'customer',
 * customer_id, and direction: 'inbound'.
 */
export async function sendMessageAsCustomer(
  clientId: string,
  leadId: string,
  body: string
) {
  const serviceSupabase = createServiceRoleClient()
  const { data: lead, error: leadError } = await serviceSupabase
    .from('leads')
    .select('business_id')
    .eq('id', leadId)
    .single()

  if (leadError || !lead?.business_id) {
    throw new Error('Lead not found or has no business')
  }

  const supabase = await createClient()
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      business_id: lead.business_id,
      lead_id: leadId,
      body,
      direction: 'inbound',
      sender_type: 'customer',
      customer_id: clientId,
    })
    .select()
    .single()

  if (error) throw error
  return message
}

/** Message row shape for customer portal (no auth for business). */
export type MessageRow = {
  id: string
  business_id: string
  lead_id: string
  body: string
  direction: string
  created_at: string
  sender_type: string | null
  team_member_id: string | null
  customer_id: string | null
}

/**
 * Fetch messages for a lead when called from the customer portal.
 * Verifies the current user is the client for this lead (same business, client linked via job or converted_to_client_id).
 * Uses service role for lead/job/messages lookups to avoid RLS blocking the customer session.
 */
export async function getMessagesForLeadForCustomer(leadId: string): Promise<MessageRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const serviceSupabase = createServiceRoleClient()
  const { data: lead, error: leadErr } = await serviceSupabase
    .from('leads')
    .select('id, business_id, converted_to_client_id')
    .eq('id', leadId)
    .single()
  if (leadErr || !lead) throw new Error('Lead not found')

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('business_id', lead.business_id)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!client) throw new Error('No client record for this business')

  const allowed =
    lead.converted_to_client_id === client.id ||
    (await (async () => {
      const { data: job } = await serviceSupabase
        .from('jobs')
        .select('id')
        .eq('business_id', lead.business_id)
        .eq('lead_id', leadId)
        .eq('client_id', client.id)
        .limit(1)
        .maybeSingle()
      return !!job
    })());
  if (!allowed) throw new Error('Not allowed to view this conversation')

  const messages = await getMessagesForLead(leadId, true)
  return messages as MessageRow[]
}
