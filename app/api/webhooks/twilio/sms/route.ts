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

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, base_duration, description')
      .eq('business_id', businessId)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('[twilio-sms] Services query error:', servicesError.message, 'code:', servicesError.code)
    }
    console.log('[twilio-sms] Services loaded:', JSON.stringify(services))

    const { data: leadRow } = await supabase
      .from('leads')
      .select('name')
      .eq('id', leadId)
      .single()

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
          const price = s.price ?? 0
          return `- id: ${s.id}, ${s.name}${price ? ` ($${Number(price).toFixed(2)})` : ''}`
        })
        .join('\n') || 'Not listed'
    const leadName = (leadRow as { name?: string } | null)?.name ?? ''

    const systemPrompt = `You are an AI assistant for ${(business as any).name}, an auto detailing business.
Your job is to answer customer questions, provide pricing information, and help book appointments via SMS.

Business info:
- Name: ${(business as any).name}
- Phone: ${businessPhone}
- Service area: ${serviceArea}
- Business hours: ${hoursStr}

Services offered (use the id when calling create_booking):
${servicesList}
${leadName ? `\nCurrent lead/customer name: ${leadName}` : ''}

Guidelines:
- Keep responses short and conversational (SMS-friendly, under 160 chars when possible)
- If customer wants to book, collect: service, date/time preference, vehicle type, address
- When you have collected all required information (service, date, time, vehicle type, and address), call the create_booking tool immediately. Do not ask for confirmation first. Do not say "booking confirmed" without calling the tool.
- Be friendly and professional
- If asked something you don't know, say you'll have the owner follow up
- Never make up prices or services not listed above
`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[twilio-sms] ANTHROPIC_API_KEY not set')
      return emptyTwiML()
    }

    const { hasSMSCredits, decrementSMSCredits } = await import('@/lib/actions/sms-credits')
    if (!(await hasSMSCredits(businessId, supabase))) {
      console.warn('[twilio-sms] Skipping AI reply: no SMS credits for business', businessId)
      return emptyTwiML()
    }

    // Build SMS config once for use in tool handler and final reply
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

    const createBookingTool = {
      name: 'create_booking' as const,
      description: 'Create a booking (job) when you have collected all required information: service, date, time, vehicle type, and address. Call this immediately once you have all five; do not ask the customer to confirm first.',
      input_schema: {
        type: 'object' as const,
        properties: {
          service_id: { type: 'string', description: 'UUID of the service from the services list' },
          scheduled_date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          scheduled_time: { type: 'string', description: 'Time in HH:MM format (24h or 12h)' },
          vehicle_type: { type: 'string', description: 'e.g. sedan, SUV, truck' },
          address: { type: 'string', description: 'Customer address for the job' },
          customer_name: { type: 'string', description: 'Optional; use lead/customer name if known' },
        },
        required: ['service_id', 'scheduled_date', 'scheduled_time', 'vehicle_type', 'address'],
      },
    }

    type MessageRole = 'user' | 'assistant'
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      | { type: 'tool_result'; tool_use_id: string; content: string }
    type ApiMessage = { role: MessageRole; content: string | ContentBlock[] }

    // History already includes the inbound we just saved (last in reversed list = latest)
    let apiMessages: ApiMessage[] =
      messages.length > 0
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'user' as const, content: messageBody }]

    type AnthropicContentBlock =
      | { type: 'text'; text?: string }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
    const maxToolRounds = 3
    let lastResponse: {
      content: AnthropicContentBlock[];
      stop_reason?: string;
    } = { content: [], stop_reason: '' }

    for (let round = 0; round <= maxToolRounds; round++) {
      const body: Record<string, unknown> = {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: apiMessages,
        tools: [createBookingTool],
      }

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text()
        console.error('[twilio-sms] Anthropic API error:', anthropicRes.status, errText)
        return emptyTwiML()
      }

      const data = (await anthropicRes.json()) as {
        content?: AnthropicContentBlock[];
        stop_reason?: string;
      }
      lastResponse = { content: data.content ?? [], stop_reason: data.stop_reason ?? '' }

      if (lastResponse.stop_reason !== 'tool_use') {
        break
      }

      const toolUses = (lastResponse.content ?? []).filter(
        (c): c is Extract<AnthropicContentBlock, { type: 'tool_use' }> => c.type === 'tool_use'
      )
      if (toolUses.length === 0) break

      const toolResults: ContentBlock[] = []
      const { sendSMS } = await import('@/lib/sms/providers')
      const serviceMap = new Map((services ?? []).map((s: any) => [s.id, s]))

      for (const block of toolUses) {
        if (block.name !== 'create_booking' || !block.id || !block.input) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id ?? '',
            content: 'Unknown tool or missing input.',
          })
          continue
        }
        const input = block.input as {
          service_id?: string;
          scheduled_date?: string;
          scheduled_time?: string;
          vehicle_type?: string;
          address?: string;
          customer_name?: string;
        }
        const serviceId = input.service_id ?? ''
        const scheduledDate = input.scheduled_date ?? ''
        const scheduledTime = input.scheduled_time ?? ''
        const vehicleType = input.vehicle_type ?? ''
        const address = input.address ?? ''
        const customerName = input.customer_name ?? null

        try {
          const service = serviceMap.get(serviceId)
          const serviceName = service?.name ?? 'Service'
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
              business_id: businessId,
              lead_id: leadId,
              client_id: null,
              title: `${serviceName} - SMS Booking`,
              service_type: serviceName,
              scheduled_date: scheduledDate,
              scheduled_time: scheduledTime,
              address,
              status: 'scheduled',
              estimated_cost: service?.price ?? null,
              estimated_duration: service?.base_duration ?? null,
              notes: `Vehicle: ${vehicleType}. Booked via AI SMS assistant.`,
            })
            .select()
            .single()

          if (jobError || !job) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Booking failed: ${jobError?.message ?? 'Unknown error'}.`,
            })
            continue
          }

          await supabase
            .from('leads')
            .update({ status: 'booked' })
            .eq('id', leadId)

          const confirmationBody = `✅ Your ${serviceName} is booked for ${scheduledDate} at ${scheduledTime}. We'll see you then! Reply STOP to opt out.`
          const sendResult = await sendSMS(config, { to: fromNumber, body: confirmationBody })
          if (sendResult.success) {
            await decrementSMSCredits(businessId, 1, supabase)
            await supabase.from('messages').insert({
              direction: 'outbound',
              sender_type: 'business',
              from_number: toNumber,
              to_number: fromNumber,
              body: confirmationBody,
              business_id: businessId,
              lead_id: leadId,
            })
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Booking created. Confirmation sent to customer.',
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Booking failed.'
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Booking failed: ${msg}`,
          })
        }
      }

      apiMessages = [
        ...apiMessages,
        { role: 'assistant' as const, content: lastResponse.content as ContentBlock[] },
        { role: 'user' as const, content: toolResults },
      ]
    }

    const aiText =
      (lastResponse.content ?? []).find((c) => c.type === 'text')?.text?.trim() ?? ''

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

    const { sendSMS } = await import('@/lib/sms/providers')
    const result = await sendSMS(config, { to: fromNumber, body: aiText })
    if (!result.success) {
      console.error('[twilio-sms] Send SMS failed:', result.error)
    } else {
      await decrementSMSCredits(businessId, 1, supabase)
    }

    return emptyTwiML()
  } catch (err) {
    console.error('[twilio-sms] Error:', err)
    return emptyTwiML()
  }
}
