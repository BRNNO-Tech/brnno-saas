import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

function emptyTwiML() {
  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  })
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = '1' + cleaned
  if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned
  return '+' + cleaned
}

function isAIEnabled(modules: unknown): boolean {
  if (!modules || typeof modules !== 'object') return false
  const m = modules as Record<string, unknown>
  if (m.ai_auto_lead === true) return true
  const lr = m.leadRecovery
  if (lr && typeof lr === 'object' && (lr as Record<string, unknown>).ai === true) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const fromRaw = params.get('From') ?? ''
    const toRaw = params.get('To') ?? ''
    const messageBody = params.get('Body') ?? ''
    const accountSid = params.get('AccountSid') ?? ''

    const fromNumber = normalizePhone(fromRaw)
    const toNumber = normalizePhone(toRaw)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[twilio-sms] Missing Supabase config')
      return emptyTwiML()
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find business by To number (match normalized twilio_phone_number)
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, business_hours, modules, twilio_subaccount_sid, twilio_subaccount_auth_token, twilio_phone_number, twilio_account_sid, sms_provider')
      .not('twilio_phone_number', 'is', null)

    if (bizError || !businesses?.length) {
      console.error('[twilio-sms] No business found for To:', toNumber, bizError?.message)
      return emptyTwiML()
    }

    const business = businesses.find((b) => {
      const stored = b.twilio_phone_number
      if (!stored) return false
      return normalizePhone(stored) === toNumber
    })

    if (!business) {
      console.error('[twilio-sms] No business matching To:', toNumber)
      return emptyTwiML()
    }

    const businessId = business.id
    const aiEnabled = isAIEnabled((business as any).modules)

    // Find or create lead by From number
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', fromNumber)
      .maybeSingle()

    let leadId: string
    if (existingLead) {
      leadId = existingLead.id
    } else {
      const { data: newLead, error: insertLeadError } = await supabase
        .from('leads')
        .insert({
          business_id: businessId,
          phone: fromNumber,
          status: 'new',
          source: 'sms_inbound',
          name: 'SMS Lead',
        })
        .select('id')
        .single()

      if (insertLeadError || !newLead) {
        console.error('[twilio-sms] Failed to create lead:', insertLeadError?.message)
        return emptyTwiML()
      }
      leadId = newLead.id
    }

    // Save inbound message (always)
    await supabase.from('messages').insert({
      direction: 'inbound',
      sender_type: 'customer',
      from_number: fromNumber,
      to_number: toNumber,
      body: messageBody,
      business_id: businessId,
      lead_id: leadId,
    })

    if (!aiEnabled) {
      return emptyTwiML()
    }

    // Load last 10 messages for conversation history (chronological for API)
    const { data: historyRows } = await supabase
      .from('messages')
      .select('direction, body')
      .eq('lead_id', leadId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (historyRows?.length) {
      const reversed = [...historyRows].reverse()
      for (const row of reversed) {
        const role = row.direction === 'inbound' ? 'user' : 'assistant'
        messages.push({ role, content: row.body ?? '' })
      }
    }

    // Business profile and services for system prompt
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('phone, service_area')
      .eq('business_id', businessId)
      .maybeSingle()

    const { data: services } = await supabase
      .from('services')
      .select('name, base_price, price')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    const profileObj = profile as { phone?: string; service_area?: string } | null
    const businessPhone = profileObj?.phone ?? (business as any).phone ?? ''
    const serviceArea = profileObj?.service_area ?? ''
    const businessHours = (business as any).business_hours
    const hoursStr =
      typeof businessHours === 'object' && businessHours !== null
        ? JSON.stringify(businessHours)
        : String(businessHours ?? '')

    const servicesList =
      (services ?? [])
        .map((s: any) => {
          const price = s.base_price ?? s.price ?? 0
          return `- ${s.name}${price ? ` ($${Number(price).toFixed(2)})` : ''}`
        })
        .join('\n') || 'Not listed'

    const systemPrompt = `You are an AI assistant for ${(business as any).name}, an auto detailing business.
Your job is to answer customer questions, provide pricing information, and help book appointments via SMS.

Business info:
- Name: ${(business as any).name}
- Phone: ${businessPhone}
- Service area: ${serviceArea}
- Business hours: ${hoursStr}

Services offered:
${servicesList}

Guidelines:
- Keep responses short and conversational (SMS-friendly, under 160 chars when possible)
- If customer wants to book, collect: service, date/time preference, vehicle type, address
- If you have enough info to book, say you'll confirm and set a flag in your response
- Be friendly and professional
- If asked something you don't know, say you'll have the owner follow up
- Never make up prices or services not listed above
`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[twilio-sms] ANTHROPIC_API_KEY not set')
      return emptyTwiML()
    }

    // History already includes the inbound we just saved (last in reversed list = latest)
    const apiMessages =
      messages.length > 0 ? messages : [{ role: 'user' as const, content: messageBody }]

    const anthropicBody = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: apiMessages,
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[twilio-sms] Anthropic API error:', anthropicRes.status, errText)
      return emptyTwiML()
    }

    const anthropicData = (await anthropicRes.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const aiText =
      anthropicData?.content?.find((c) => c.type === 'text')?.text?.trim() ?? ''

    if (!aiText) {
      console.error('[twilio-sms] Empty AI response')
      return emptyTwiML()
    }

    // Save outbound message
    await supabase.from('messages').insert({
      direction: 'outbound',
      sender_type: 'business',
      from_number: toNumber,
      to_number: fromNumber,
      body: aiText,
      business_id: businessId,
      lead_id: leadId,
    })

    // Build Twilio config (subaccount first, then fallbacks)
    const biz = business as any
    const smsProvider = biz.sms_provider || 'twilio'
    const config: any = { provider: smsProvider }

    if (smsProvider === 'twilio') {
      if (biz.twilio_subaccount_sid && biz.twilio_subaccount_auth_token && biz.twilio_phone_number) {
        config.twilioAccountSid = biz.twilio_subaccount_sid
        config.twilioAuthToken = biz.twilio_subaccount_auth_token
        config.twilioPhoneNumber = biz.twilio_phone_number
      } else if (biz.twilio_account_sid && process.env.TWILIO_AUTH_TOKEN && (biz.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER)) {
        config.twilioAccountSid = biz.twilio_account_sid
        config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
        config.twilioPhoneNumber = biz.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER
      } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        config.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
        config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
        config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
      }
    } else if (smsProvider === 'surge') {
      config.surgeApiKey = biz.surge_api_key
      config.surgeAccountId = biz.surge_account_id
    }

    const { sendSMS } = await import('@/lib/sms/providers')
    const result = await sendSMS(config, { to: fromNumber, body: aiText })
    if (!result.success) {
      console.error('[twilio-sms] Send SMS failed:', result.error)
    }

    return emptyTwiML()
  } catch (err) {
    console.error('[twilio-sms] Error:', err)
    return emptyTwiML()
  }
}
