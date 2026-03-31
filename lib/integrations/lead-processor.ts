import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { fetchLeadData } from '@/lib/integrations/meta'
import type { IntegrationAutomations, MetaLeadFieldData } from '@/types/marketing'
import { normalizePhoneNumber } from '@/lib/utils/phone'
import type { SMSProviderConfig } from '@/lib/sms/providers'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function welcomeEmailHtml(
  firstName: string,
  businessName: string,
  bookingUrl: string,
  clientId: string,
  businessId: string
): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const inner = `<div style="font-family:system-ui,sans-serif;line-height:1.5">
<p>Hi ${escapeHtml(firstName)}, thanks for reaching out to ${escapeHtml(businessName)}.</p>
<p>We'll be in touch shortly. In the meantime, you can book directly here: <a href="${escapeHtml(bookingUrl)}">${escapeHtml(bookingUrl)}</a></p>
</div>`
  if (!base) return inner
  const q = new URLSearchParams({ client: clientId, org: businessId })
  const href = `${base}/unsubscribe?${q.toString()}`
  const footer = `<p style="margin-top:32px;font-size:12px;color:#888;">Don't want these emails? <a href="${escapeHtml(href)}">Unsubscribe</a></p>`
  return inner + footer
}

function parseAutomations(raw: unknown): IntegrationAutomations {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    createCrmRecord: o.createCrmRecord !== false,
    fireSmsAgent: o.fireSmsAgent !== false,
    sendWelcomeEmail: o.sendWelcomeEmail !== false,
    addToNurtureCampaign: o.addToNurtureCampaign === true,
    nurtureCampaignId:
      typeof o.nurtureCampaignId === 'string'
        ? o.nurtureCampaignId
        : o.nurtureCampaignId === null
          ? null
          : undefined,
  }
}

function extractContactFields(fieldData: MetaLeadFieldData[]) {
  let fullName = ''
  let firstName = ''
  let lastName = ''
  let email = ''
  let phone = ''

  for (const f of fieldData) {
    const v = f.values?.[0]?.trim() || ''
    switch (f.name) {
      case 'full_name':
        fullName = v
        break
      case 'first_name':
        firstName = v
        break
      case 'last_name':
        lastName = v
        break
      case 'email':
        email = v
        break
      case 'phone_number':
        phone = v
        break
      default:
        break
    }
  }

  const name =
    fullName ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    'Lead'

  return { name, email, phone }
}

async function buildSmsProviderConfig(
  business: Record<string, unknown>
): Promise<{ config: SMSProviderConfig } | { error: string }> {
  const subaccountCreds =
    business.twilio_subaccount_sid && business.twilio_subaccount_auth_token
      ? {
          accountSid: business.twilio_subaccount_sid as string,
          authToken: business.twilio_subaccount_auth_token as string,
          phoneNumber: business.twilio_phone_number as string | undefined,
        }
      : null
  let smsProvider: 'surge' | 'twilio' | null = null
  if (business.sms_provider === 'surge' || business.sms_provider === 'twilio') {
    smsProvider = business.sms_provider as 'surge' | 'twilio'
  } else if (business.surge_api_key && business.surge_account_id) {
    smsProvider = 'surge'
  } else if (
    subaccountCreds?.accountSid ||
    business.twilio_account_sid ||
    process.env.TWILIO_ACCOUNT_SID
  ) {
    smsProvider = 'twilio'
  }
  if (!smsProvider) {
    return { error: 'No SMS provider configured.' }
  }

  const config: SMSProviderConfig = { provider: smsProvider }
  if (smsProvider === 'surge') {
    config.surgeApiKey = business.surge_api_key as string | undefined
    config.surgeAccountId = business.surge_account_id as string | undefined
    if (!config.surgeApiKey || !config.surgeAccountId) {
      return { error: 'Surge credentials not configured.' }
    }
  } else {
    if (subaccountCreds?.accountSid && subaccountCreds.authToken) {
      config.twilioAccountSid = subaccountCreds.accountSid
      config.twilioAuthToken = subaccountCreds.authToken
      config.twilioPhoneNumber =
        (business.twilio_phone_number as string | undefined) || subaccountCreds.phoneNumber
    } else {
      config.twilioAccountSid = business.twilio_account_sid as string | undefined
      config.twilioAuthToken = business.twilio_auth_token as string | undefined
      config.twilioPhoneNumber = business.twilio_phone_number as string | undefined
    }
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      return { error: 'Twilio not configured.' }
    }
  }
  return { config }
}

export async function processLead(metaLeadId: string, integrationId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('[lead-processor] Missing Supabase env')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const fail = async (msg: string) => {
    await supabase
      .from('integration_leads')
      .update({ status: 'failed', error: msg, processed_at: new Date().toISOString() })
      .eq('meta_lead_id', metaLeadId)
  }

  try {
    const { data: integration, error: intErr } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (intErr || !integration) {
      await fail('Integration not found')
      return
    }

    const token = integration.page_access_token as string
    if (!token) {
      await fail('Missing page access token')
      return
    }

    const automations = parseAutomations(integration.automations)
    const businessId = integration.business_id as string

    const { data: leadRow, error: leadErr } = await supabase
      .from('integration_leads')
      .select('id')
      .eq('meta_lead_id', metaLeadId)
      .maybeSingle()

    if (leadErr || !leadRow) {
      await fail('Lead row not found')
      return
    }

    const graphLead = await fetchLeadData(metaLeadId, token)
    const { name, email, phone } = extractContactFields(graphLead.fieldData)

    const rawPayload = {
      field_data: graphLead.fieldData,
      created_time: graphLead.createdTime,
      ad_id: graphLead.adId,
      ad_name: graphLead.adName,
      form_id: graphLead.formId,
    }

    await supabase
      .from('integration_leads')
      .update({
        ad_id: graphLead.adId || null,
        ad_name: graphLead.adName || null,
        form_id: graphLead.formId || null,
        raw_data: rawPayload as unknown as Record<string, unknown>,
      })
      .eq('meta_lead_id', metaLeadId)

    let clientId: string | null = null

    if (automations.createCrmRecord) {
      const normPhone = phone ? normalizePhoneNumber(phone) : null

      if (email) {
        const { data: byEmail } = await supabase
          .from('clients')
          .select('id')
          .eq('business_id', businessId)
          .ilike('email', email)
          .maybeSingle()
        if (byEmail?.id) clientId = byEmail.id
      }

      if (!clientId && normPhone) {
        const { data: byPhone } = await supabase
          .from('clients')
          .select('id')
          .eq('business_id', businessId)
          .eq('phone', normPhone)
          .maybeSingle()
        if (byPhone?.id) clientId = byPhone.id
      }

      if (!clientId) {
        const { data: inserted, error: insErr } = await supabase
          .from('clients')
          .insert({
            business_id: businessId,
            name,
            email: email || null,
            phone: normPhone || phone || null,
            source: 'meta_lead',
          })
          .select('id')
          .single()

        if (insErr) {
          throw new Error(insErr.message || 'Failed to create client')
        }
        clientId = inserted.id
      }

      await supabase.from('integration_leads').update({ client_id: clientId }).eq('meta_lead_id', metaLeadId)
    }

    const { data: business } = await supabase
      .from('businesses')
      .select(
        `
        id,
        name,
        sender_name,
        subdomain,
        sms_provider,
        surge_api_key,
        surge_account_id,
        twilio_account_sid,
        twilio_auth_token,
        twilio_phone_number,
        twilio_subaccount_sid,
        twilio_subaccount_auth_token
      `
      )
      .eq('id', businessId)
      .single()

    const biz = (business || {}) as Record<string, unknown>
    const bizName = String(biz.name || 'Your business').replace(/[\r\n]/g, '')
    const fromName = (biz.sender_name as string) || bizName
    const subdomain = (biz.subdomain as string) || ''
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const bookingUrl =
      appUrl && subdomain ? `${appUrl}/${subdomain}/book` : appUrl || ''

    if (automations.fireSmsAgent && phone) {
      const to = normalizePhoneNumber(phone)
      if (to) {
        const cfg = await buildSmsProviderConfig(biz)
        if ('config' in cfg) {
          const { sendSMS } = await import('@/lib/sms/providers')
          const first = name.split(' ')[0] || 'there'
          await sendSMS(cfg.config, {
            to,
            body: `Hi ${first}! Thanks for your interest in ${bizName}. We'll be in touch shortly.`,
            fromName,
            contactFirstName: first,
          })
        }
      }
    }

    if (automations.sendWelcomeEmail && email) {
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const resend = new Resend(resendKey)
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        const fromHeader = `${fromName.slice(0, 80)} <${fromEmail}>`
        const html =
          clientId != null
            ? welcomeEmailHtml(
                name.split(' ')[0] || 'there',
                bizName,
                bookingUrl || appUrl,
                clientId,
                businessId
              )
            : `<div style="font-family:system-ui,sans-serif;line-height:1.5">
<p>Hi ${escapeHtml(name.split(' ')[0] || 'there')}, thanks for reaching out to ${escapeHtml(bizName)}.</p>
<p>We'll be in touch shortly.${
                bookingUrl
                  ? ` In the meantime, you can book directly here: <a href="${escapeHtml(bookingUrl)}">${escapeHtml(bookingUrl)}</a>`
                  : ''
              }</p>
</div>`
        await resend.emails.send({
          from: fromHeader,
          to: email,
          subject: `Thanks for your interest in ${bizName}!`,
          html,
        })
      }
    }

    if (
      automations.addToNurtureCampaign &&
      automations.nurtureCampaignId &&
      clientId
    ) {
      const { error: crErr } = await supabase.from('campaign_recipients').insert({
        campaign_id: automations.nurtureCampaignId,
        client_id: clientId,
        business_id: businessId,
        status: 'pending',
      })
      if (crErr && crErr.code !== '23505') {
        console.warn('[lead-processor] campaign_recipients:', crErr.message)
      }
    }

    await supabase
      .from('integration_leads')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        raw_data: rawPayload as unknown as Record<string, unknown>,
      })
      .eq('meta_lead_id', metaLeadId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    await supabase
      .from('integration_leads')
      .update({
        status: 'failed',
        error: msg,
        processed_at: new Date().toISOString(),
      })
      .eq('meta_lead_id', metaLeadId)
  }
}
