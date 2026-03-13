'use server'

import { createClient } from '@/lib/supabase/server'
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
 */
export async function getMessagesForLead(leadId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

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
 * Finds the business from the lead and inserts with sender_type: 'customer',
 * customer_id, and direction: 'inbound'.
 */
export async function sendMessageAsCustomer(
  clientId: string,
  leadId: string,
  body: string
) {
  const supabase = await createClient()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('business_id')
    .eq('id', leadId)
    .single()

  if (leadError || !lead?.business_id) {
    throw new Error('Lead not found or has no business')
  }

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
 */
export async function getMessagesForLeadForCustomer(leadId: string): Promise<MessageRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: lead, error: leadErr } = await supabase
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
      const { data: job } = await supabase
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

  const { data, error } = await supabase
    .from('messages')
    .select('id, business_id, lead_id, body, direction, created_at, sender_type, team_member_id, customer_id')
    .eq('lead_id', leadId)
    .eq('business_id', lead.business_id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as MessageRow[]
}
