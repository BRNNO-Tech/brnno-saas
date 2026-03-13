'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { getBusiness as getBusinessFull } from './business'
import { getTwilioCredentials } from './twilio-subaccounts'
import { sendSMS } from '@/lib/sms/providers'
import type { SMSProviderConfig } from '@/lib/sms/providers'
import { normalizePhoneNumber } from '@/lib/utils/phone'

export type MessageRow = {
  id: string
  business_id: string
  lead_id: string | null
  direction: 'inbound' | 'outbound'
  from_number: string
  to_number: string
  body: string
  created_at: string
}

export type ConversationItem = {
  leadId: string
  leadName: string
  lastPreview: string
  lastAt: string
}

/**
 * Get conversations (one per lead) with latest message preview for the current business.
 * Only includes leads that have at least one message in the messages table.
 */
export async function getConversations(): Promise<ConversationItem[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: messages, error: msgError } = await supabase
    .from('sms_messages')
    .select('id, lead_id, body, created_at')
    .eq('business_id', businessId)
    .not('lead_id', 'is', null)
    .order('created_at', { ascending: false })

  if (msgError) {
    console.error('[getConversations] messages error:', msgError.code, msgError.message, msgError)
    return []
  }
  if (!messages?.length) return []

  // One row per lead: latest message
  const byLead = new Map<string | null, { body: string; created_at: string }>()
  for (const m of messages) {
    const lid = m.lead_id
    if (lid && !byLead.has(lid)) byLead.set(lid, { body: m.body, created_at: m.created_at })
  }
  const leadIds = Array.from(byLead.keys()).filter(Boolean) as string[]
  if (leadIds.length === 0) return []

  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('id, name')
    .in('id', leadIds)

  if (leadError || !leads?.length) return []

  const nameById = new Map(leads.map((l) => [l.id, l.name ?? 'Unknown']))
  const list = leadIds.map((leadId) => {
    const rec = byLead.get(leadId)!
    const preview = rec.body.length > 60 ? rec.body.slice(0, 60) + '…' : rec.body
    return {
      leadId,
      leadName: nameById.get(leadId) ?? 'Unknown',
      lastPreview: preview,
      lastAt: rec.created_at,
    }
  })
  list.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
  return list
}

/**
 * Get all messages for a lead, ordered by created_at ASC.
 */
export async function getMessagesForLead(leadId: string): Promise<MessageRow[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('sms_messages')
    .select('id, business_id, lead_id, direction, from_number, to_number, body, created_at')
    .eq('business_id', businessId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getMessagesForLead] error:', error)
    return []
  }
  return (data ?? []) as MessageRow[]
}

/**
 * Send an SMS to a lead via Twilio (using business credentials), save to messages table, return the new message.
 */
export async function sendMessage(
  leadId: string,
  body: string
): Promise<{ success: true; message: MessageRow } | { success: false; error: string }> {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  const business = await getBusinessFull()
  if (!business) return { success: false, error: 'Business not found' }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, name, phone, sms_consent, business_id')
    .eq('id', leadId)
    .eq('business_id', businessId)
    .single()

  if (leadError || !lead) return { success: false, error: 'Lead not found' }
  if (!lead.phone) return { success: false, error: 'Lead does not have a phone number' }
  if (lead.phone.includes('X') || lead.phone.includes('x') || lead.phone.includes('*')) {
    return { success: false, error: 'Lead phone number is masked or incomplete' }
  }
  if (lead.sms_consent === false) {
    return { success: false, error: 'Lead has not consented to receive SMS' }
  }

  const subaccountCreds = await getTwilioCredentials(businessId)
  const businessWithFields = business as Record<string, unknown>

  let smsProvider: 'surge' | 'twilio' | null = null
  if (businessWithFields.sms_provider === 'surge' || businessWithFields.sms_provider === 'twilio') {
    smsProvider = businessWithFields.sms_provider as 'surge' | 'twilio'
  } else {
    if (businessWithFields.surge_api_key && businessWithFields.surge_account_id) smsProvider = 'surge'
    else if (
      subaccountCreds?.accountSid ||
      businessWithFields.twilio_account_sid ||
      process.env.TWILIO_ACCOUNT_SID
    ) {
      smsProvider = 'twilio'
    }
  }

  if (!smsProvider) {
    return { success: false, error: 'No SMS provider configured. Set up SMS in Settings → Channels.' }
  }

  const config: SMSProviderConfig = { provider: smsProvider }
  if (smsProvider === 'surge') {
    config.surgeApiKey = businessWithFields.surge_api_key as string | undefined
    config.surgeAccountId = businessWithFields.surge_account_id as string | undefined
    if (!config.surgeApiKey || !config.surgeAccountId) {
      return { success: false, error: 'Surge credentials not configured.' }
    }
  } else {
    if (subaccountCreds?.accountSid && subaccountCreds?.authToken && subaccountCreds?.phoneNumber) {
      config.twilioAccountSid = subaccountCreds.accountSid
      config.twilioAuthToken = subaccountCreds.authToken
      config.twilioPhoneNumber = subaccountCreds.phoneNumber
    } else if (businessWithFields.twilio_account_sid) {
      config.twilioAccountSid = businessWithFields.twilio_account_sid as string
      config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
      config.twilioPhoneNumber = (businessWithFields.twilio_phone_number as string) || process.env.TWILIO_PHONE_NUMBER
    } else {
      config.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
      config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
      config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    }
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      return { success: false, error: 'Twilio credentials not configured.' }
    }
  }

  const result = await sendSMS(config, { to: lead.phone, body })
  if (!result.success) {
    return { success: false, error: result.error ?? 'Failed to send SMS' }
  }

  const toE164 = normalizePhoneNumber(lead.phone) ?? lead.phone
  const fromNumber =
    config.twilioPhoneNumber ??
    (businessWithFields.surge_phone_number as string | undefined) ??
    (businessWithFields.twilio_phone_number as string | undefined)
  const fromE164 = fromNumber ? (normalizePhoneNumber(fromNumber) ?? fromNumber) : toE164

  const { data: inserted, error: insertError } = await supabase
    .from('sms_messages')
    .insert({
      business_id: businessId,
      lead_id: leadId,
      direction: 'outbound',
      from_number: fromE164,
      to_number: toE164,
      body,
    })
    .select('id, business_id, lead_id, direction, from_number, to_number, body, created_at')
    .single()

  if (insertError) {
    console.error('[sendMessage] insert error:', insertError)
    return { success: false, error: 'Message sent but failed to save to inbox.' }
  }

  return { success: true, message: inserted as MessageRow }
}
