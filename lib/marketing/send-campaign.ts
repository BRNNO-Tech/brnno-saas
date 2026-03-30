import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { resolveAudienceClients } from '@/lib/marketing/audience'
import type { AudienceFilter } from '@/types/marketing'
import { normalizePhoneNumber } from '@/lib/utils/phone'
import { getTwilioCredentials } from '@/lib/actions/twilio-subaccounts'
import type { SMSProviderConfig } from '@/lib/sms/providers'

const EMAIL_BATCH = 50
const EMAIL_DELAY_MS = 500
const SMS_BATCH = 20
const SMS_DELAY_MS = 300

function buildMarketingEmailHtml(
  bodyPlain: string,
  unsubscribe?: { clientId: string; businessId: string }
): string {
  const inner = `<div style="font-family:system-ui,sans-serif;line-height:1.5;white-space:pre-wrap">${escapeHtml(
    bodyPlain
  )}</div>`
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (!unsubscribe || !base) return inner
  const q = new URLSearchParams({ client: unsubscribe.clientId, org: unsubscribe.businessId })
  const href = `${base}/unsubscribe?${q.toString()}`
  const footer = `<p style="margin-top:32px;font-size:12px;color:#888;">Don't want these emails? <a href="${escapeHtml(
    href
  )}">Unsubscribe</a></p>`
  return inner + footer
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function buildSmsProviderConfig(
  businessId: string,
  business: Record<string, unknown>
): Promise<{ config: SMSProviderConfig } | { error: string }> {
  const subaccountCreds = await getTwilioCredentials(businessId)
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
    return { error: 'No SMS provider configured. Set up SMS in Settings → Channels.' }
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
      return { error: 'Twilio credentials not configured. Check Settings → Channels.' }
    }
  }
  return { config }
}

export async function executeCampaignSend(
  supabase: SupabaseClient,
  campaignId: string,
  businessId: string
): Promise<{ ok: true; sent: number; failed: number } | { ok: false; error: string }> {
  const { data: campaign, error: cErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('business_id', businessId)
    .single()

  if (cErr || !campaign) {
    return { ok: false, error: 'Campaign not found' }
  }

  if (campaign.status === 'sent') {
    return { ok: false, error: 'Campaign was already sent' }
  }

  const audienceFilter = (campaign.audience_filter || {}) as AudienceFilter
  const channel = campaign.channel as 'email' | 'sms'

  const clients = await resolveAudienceClients(supabase, businessId, audienceFilter, channel)
  if (clients.length === 0) {
    await supabase
      .from('campaigns')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        recipient_count: 0,
      })
      .eq('id', campaignId)
    return { ok: false, error: 'No recipients match this audience for the selected channel.' }
  }

  const { data: business, error: bErr } = await supabase
    .from('businesses')
    .select(
      `
      id,
      name,
      sender_name,
      email,
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

  if (bErr || !business) {
    return { ok: false, error: 'Business not found' }
  }

  const biz = business as Record<string, unknown>
  const bizName = String(biz.name || 'Your business').replace(/[\r\n]/g, '')
  const fromName = (biz.sender_name as string) || bizName

  await supabase.from('campaign_recipients').delete().eq('campaign_id', campaignId)

  const recipientInserts = clients.map((c) => ({
    campaign_id: campaignId,
    client_id: c.id,
    business_id: businessId,
    status: 'pending' as const,
  }))

  const { error: insErr } = await supabase.from('campaign_recipients').insert(recipientInserts)
  if (insErr) {
    console.error('[send-campaign] insert recipients:', insErr)
    return { ok: false, error: insErr.message || 'Failed to create recipient rows' }
  }

  const { data: recRows } = await supabase
    .from('campaign_recipients')
    .select('id, client_id')
    .eq('campaign_id', campaignId)

  const recByClient = new Map<string, string>()
  for (const r of recRows || []) {
    recByClient.set((r as { client_id: string }).client_id, (r as { id: string }).id)
  }

  let sent = 0
  let failed = 0

  if (channel === 'email') {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
      return { ok: false, error: 'Email is not configured (RESEND_API_KEY).' }
    }
    const resend = new Resend(resendKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = String(campaign.subject || '').trim() || `Message from ${bizName}`
    const fromHeader = `${fromName.slice(0, 80)} <${fromEmail}>`

    const chunks: typeof clients[] = []
    for (let i = 0; i < clients.length; i += EMAIL_BATCH) {
      chunks.push(clients.slice(i, i + EMAIL_BATCH))
    }

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci]
      for (const c of chunk) {
        const email = c.email?.trim()
        const recId = recByClient.get(c.id)
        if (!email || !recId) {
          failed++
          if (recId) {
            await supabase
              .from('campaign_recipients')
              .update({ status: 'failed', error: 'No email' })
              .eq('id', recId)
          }
          continue
        }
        try {
          const html = buildMarketingEmailHtml(String(campaign.body || ''), {
            clientId: c.id,
            businessId,
          })
          const result = await resend.emails.send({
            from: fromHeader,
            to: email,
            subject,
            html,
          })
          if (result.error) {
            failed++
            await supabase
              .from('campaign_recipients')
              .update({ status: 'failed', error: result.error.message || 'Resend error' })
              .eq('id', recId)
          } else {
            sent++
            await supabase
              .from('campaign_recipients')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', recId)
          }
        } catch (e) {
          failed++
          const msg = e instanceof Error ? e.message : 'Send error'
          await supabase.from('campaign_recipients').update({ status: 'failed', error: msg }).eq('id', recId)
        }
      }
      if (ci < chunks.length - 1) await sleep(EMAIL_DELAY_MS)
    }
  } else {
    const cfgResult = await buildSmsProviderConfig(businessId, biz)
    if ('error' in cfgResult) {
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
      return { ok: false, error: cfgResult.error }
    }
    const { sendSMS } = await import('@/lib/sms/providers')
    const { hasSMSCredits, decrementSMSCredits } = await import('@/lib/actions/sms-credits')

    const bodyText = String(campaign.body || '').trim()
    if (!bodyText) {
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
      return { ok: false, error: 'SMS body is empty.' }
    }

    const chunks: typeof clients[] = []
    for (let i = 0; i < clients.length; i += SMS_BATCH) {
      chunks.push(clients.slice(i, i + SMS_BATCH))
    }

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci]
      for (const c of chunk) {
        const rawPhone = c.phone?.trim()
        const recId = recByClient.get(c.id)
        if (!rawPhone || !recId) {
          failed++
          if (recId) {
            await supabase
              .from('campaign_recipients')
              .update({ status: 'failed', error: 'No phone' })
              .eq('id', recId)
          }
          continue
        }
        const to = normalizePhoneNumber(rawPhone)
        if (!to) {
          failed++
          await supabase
            .from('campaign_recipients')
            .update({ status: 'failed', error: 'Invalid phone' })
            .eq('id', recId)
          continue
        }
        if (!(await hasSMSCredits(businessId))) {
          failed++
          await supabase
            .from('campaign_recipients')
            .update({ status: 'failed', error: 'No SMS credits remaining' })
            .eq('id', recId)
          continue
        }
        const display = c.name?.trim() || 'there'
        const firstName = display.split(' ')[0] || undefined
        const lastName = display.split(' ').slice(1).join(' ') || undefined
        try {
          const result = await sendSMS(cfgResult.config, {
            to,
            body: bodyText.slice(0, 1600),
            fromName,
            contactFirstName: firstName,
            contactLastName: lastName,
          })
          if (!result.success) {
            failed++
            await supabase
              .from('campaign_recipients')
              .update({ status: 'failed', error: result.error || 'SMS failed' })
              .eq('id', recId)
          } else {
            sent++
            await decrementSMSCredits(businessId, 1)
            await supabase
              .from('campaign_recipients')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', recId)
          }
        } catch (e) {
          failed++
          const msg = e instanceof Error ? e.message : 'SMS error'
          await supabase.from('campaign_recipients').update({ status: 'failed', error: msg }).eq('id', recId)
        }
      }
      if (ci < chunks.length - 1) await sleep(SMS_DELAY_MS)
    }
  }

  const finalStatus: 'sent' | 'failed' = failed > 0 && sent === 0 ? 'failed' : 'sent'
  await supabase
    .from('campaigns')
    .update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipient_count: clients.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return { ok: true, sent, failed }
}
export async function executeCampaignTestSend(
  supabase: SupabaseClient,
  campaignId: string,
  businessId: string,
  testRecipient: { email?: string | null; phone?: string | null }
): Promise<{ ok: true; recipient: string } | { ok: false; error: string }> {
  const { data: campaign, error: cErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('business_id', businessId)
    .single()

  if (cErr || !campaign) {
    return { ok: false, error: 'Campaign not found' }
  }

  const channel = campaign.channel as 'email' | 'sms'
  const bodyText = String(campaign.body || '').trim()
  if (!bodyText) {
    return { ok: false, error: 'Message body is empty.' }
  }

  const { data: business, error: bErr } = await supabase
    .from('businesses')
    .select(
      `
      id,
      name,
      sender_name,
      email,
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

  if (bErr || !business) {
    return { ok: false, error: 'Business not found' }
  }

  const biz = business as Record<string, unknown>
  const bizName = String(biz.name || 'Your business').replace(/[\r\n]/g, '')
  const fromName = (biz.sender_name as string) || bizName

  if (channel === 'email') {
    const email = testRecipient.email?.trim()
    if (!email) {
      return { ok: false, error: 'Your account has no email address for test sends.' }
    }
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return { ok: false, error: 'Email is not configured (RESEND_API_KEY).' }
    }
    const resend = new Resend(resendKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = String(campaign.subject || '').trim() || `Message from ${bizName}`
    const fromHeader = `${fromName.slice(0, 80)} <${fromEmail}>`
    const html = buildMarketingEmailHtml(String(campaign.body || ''))
    try {
      const result = await resend.emails.send({
        from: fromHeader,
        to: email,
        subject,
        html,
      })
      if (result.error) {
        return { ok: false, error: result.error.message || 'Resend error' }
      }
      return { ok: true, recipient: email }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Send error' }
    }
  }

  const rawPhone = testRecipient.phone?.trim()
  const to = rawPhone ? normalizePhoneNumber(rawPhone) : null
  if (!to) {
    return { ok: false, error: 'Your account has no phone number for SMS test sends.' }
  }

  const cfgResult = await buildSmsProviderConfig(businessId, biz)
  if ('error' in cfgResult) {
    return { ok: false, error: cfgResult.error }
  }
  const { sendSMS } = await import('@/lib/sms/providers')
  const { hasSMSCredits, decrementSMSCredits } = await import('@/lib/actions/sms-credits')
  if (!(await hasSMSCredits(businessId))) {
    return { ok: false, error: 'No SMS credits remaining' }
  }
  try {
    const result = await sendSMS(cfgResult.config, {
      to,
      body: bodyText.slice(0, 1600),
      fromName,
      contactFirstName: 'there',
    })
    if (!result.success) {
      return { ok: false, error: result.error || 'SMS failed' }
    }
    await decrementSMSCredits(businessId, 1)
    return { ok: true, recipient: to }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SMS error' }
  }
}


function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
