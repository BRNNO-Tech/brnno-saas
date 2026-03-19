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

// Simple extraction: look for "my name is X" / "I'm X" / "this is X" / "it's X" or a line that looks like a name (2–3 words, no digits)
function parseNameFromConversation(messages: { role: string; content: string }[]): string | null {
  const customerMessages = messages.filter((m) => m.role === 'user').map((m) => (m.content || '').trim())
  const namePatterns = [
    /(?:my name is|i'm|i am|this is|it's|it is|call me|name is)\s+([A-Za-z][A-Za-z'\s]{1,48})/i,
    /^([A-Za-z][A-Za-z'\s]{1,48})$/m,
  ]
  for (const text of customerMessages) {
    for (const re of namePatterns) {
      const match = text.match(re)
      if (match && match[1]) {
        const name = match[1].trim()
        if (name.length >= 2 && name.length <= 50) return name
      }
    }
  }
  return null
}

// Match email in customer messages
function parseEmailFromConversation(messages: { role: string; content: string }[]): string | null {
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  for (const m of messages) {
    if (m.role !== 'user') continue
    const match = (m.content || '').match(emailRe)
    if (match) return match[0]
  }
  return null
}

export async function GET() {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'application/xml' } }
  )
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

    // Service role client only — no session. All DB operations in this webhook must use this client.
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find business by To number (match normalized twilio_phone_number)
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, business_hours, modules, twilio_subaccount_sid, twilio_subaccount_auth_token, twilio_phone_number, twilio_account_sid, sms_provider, subdomain')
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
    const bizPhone = (business as any).twilio_phone_number
    if (bizPhone && normalizePhone(bizPhone) === fromNumber) {
      return emptyTwiML()
    }

    const aiEnabled = isAIEnabled((business as any).modules)

    // Create lead immediately on first message (phone only, name 'SMS Lead'); or find existing
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, status, phone')
      .eq('business_id', businessId)
      .eq('phone', fromNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('[twilio-sms] Lead lookup result:', { data: existingLead, error: leadError })
    console.log('[twilio-sms] Phone comparison:', { normalizedFrom: fromNumber, dbPhone: existingLead?.phone ?? '(no lead found)' })

    let leadId: string
    let leadName: string
    let leadStatus: string

    if (existingLead) {
      leadId = existingLead.id
      leadName = (existingLead as { name?: string }).name ?? 'SMS Lead'
      leadStatus = (existingLead as { status?: string }).status ?? 'new'
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
      leadName = 'SMS Lead'
      leadStatus = 'new'
    }

    // 1. Save inbound message to DB first (so history load below includes it)
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

    // 2. THEN load last 10 messages for conversation history (includes the just-saved inbound)
    // Order by created_at ASC (oldest first) so conversation flows correctly for the AI
    const { data: historyRowsRaw } = await supabase
      .from('messages')
      .select('direction, body, created_at')
      .eq('lead_id', leadId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    const historyRows = (historyRowsRaw ?? []).slice().sort((a, b) => {
      const tA = (a as { created_at?: string }).created_at ?? ''
      const tB = (b as { created_at?: string }).created_at ?? ''
      return tA.localeCompare(tB)
    })

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (historyRows.length) {
      for (const row of historyRows) {
        if (row.direction === 'inbound') {
          messages.push({ role: 'user', content: row.body ?? '' })
        } else if (row.direction === 'outbound') {
          messages.push({ role: 'assistant', content: row.body ?? '' })
        }
      }
    }
    // Ensure current inbound message is at the end as the last user message
    if (messages.length === 0 || messages[messages.length - 1].content !== messageBody) {
      messages.push({ role: 'user', content: messageBody })
    }

    // Update lead name and email in DB immediately when we extract from conversation
    const parsedName = parseNameFromConversation(messages)
    const parsedEmail = parseEmailFromConversation(messages)
    const earlyUpdates: { name?: string; email?: string } = {}
    if (leadName === 'SMS Lead' && parsedName) earlyUpdates.name = parsedName
    if (parsedEmail) earlyUpdates.email = parsedEmail
    if (Object.keys(earlyUpdates).length > 0) {
      await supabase.from('leads').update(earlyUpdates).eq('id', leadId).eq('business_id', businessId)
      if (earlyUpdates.name) leadName = parsedName!
    }

    // 3. Pass to AI
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, base_duration, description')
      .eq('business_id', businessId)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('[twilio-sms] Services query error:', servicesError.message)
    }

    const biz = business as any
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''
    const subdomain = biz.subdomain || ''
    const bookingLink = appUrl && subdomain ? `${appUrl.replace(/\/$/, '')}/${subdomain}/book` : ''

    const servicesList =
      (services ?? [])
        .map((s: any) => {
          const price = s.price != null ? Number(s.price) : null
          return `${s.name}${price != null ? ` — $${price.toFixed(2)}` : ''}`
        })
        .join('\n') || 'Not listed'

    const systemPrompt = `You are a friendly AI assistant for ${biz.name}, an auto detailing business. Your job is to be helpful, capture the customer's name, and send them the booking link.

Business services (for answering questions only):
${servicesList}

Flow:
1. Greet warmly
2. Answer any questions about services or pricing naturally
3. Ask for their name if you don't have it
4. Once you have their name, send them the booking link (do not wait for email)
5. After sending the link, you can ask for email casually for confirmation

Booking link: ${bookingLink || '(not configured)'}

Rules:
- Keep messages short and SMS-friendly (under 160 chars when possible)
- Be warm, helpful, and conversational
- Answer service/pricing questions using the list above
- Never say you can "book" them — always direct to the booking link
- Say things like "you can book here" not "I'll book you in"
- Send the booking link as soon as you have their name (email is optional, after the link)
- Booking message example:
  "Here's your booking link [name]: ${bookingLink || 'our booking page'} 🚗 Easy 2 min booking!"
- After sending the link, to ask for email use something like:
  "Also, want a confirmation email? Drop your email and I'll send details! 📧"
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

    let apiMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((m) => ({ role: m.role, content: m.content }))
    if (apiMessages.length === 0) {
      apiMessages = [{ role: 'user' as const, content: messageBody }]
    }

    console.log('[twilio-sms] Conversation history:', JSON.stringify(apiMessages.map((m) => ({ role: m.role, preview: m.content.substring(0, 50) }))))

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[twilio-sms] Anthropic API error:', anthropicRes.status, errText)
      return emptyTwiML()
    }

    const data = (await anthropicRes.json()) as { content?: Array<{ type: string; text?: string }> }
    const aiText = (data.content ?? []).find((c) => c.type === 'text')?.text?.trim() ?? ''

    if (!aiText) {
      console.error('[twilio-sms] Empty AI response')
      return emptyTwiML()
    }

    // Update lead status (new → engaged) after first AI response; name/email already updated above
    if (leadStatus === 'new') {
      await supabase.from('leads').update({ status: 'engaged' }).eq('id', leadId).eq('business_id', businessId)
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
