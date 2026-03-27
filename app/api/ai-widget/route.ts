import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppBaseUrl } from '@/lib/utils/app-url'
import { getStartingPrice } from '@/lib/utils/service-pricing'
import { getTierFromBusiness } from '@/lib/permissions'

const MAX_MESSAGES = 24
const MAX_CONTENT_LEN = 4000

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function truncateJson(value: unknown, maxLen: number): string {
  try {
    const s = JSON.stringify(value)
    if (s.length <= maxLen) return s
    return `${s.slice(0, maxLen)}…`
  } catch {
    return String(value).slice(0, maxLen)
  }
}

function serviceDurationMinutes(s: {
  duration_minutes?: number | null
  base_duration?: number | null
  estimated_duration?: number | null
}): number {
  return (
    Number(s.duration_minutes) ||
    Number(s.base_duration) ||
    Number(s.estimated_duration) ||
    0
  )
}

function buildSystemPrompt(
  business: {
    name: string
    subdomain: string
    business_hours: unknown
    billing_plan: string | null
    subscription_plan?: string | null
    subscription_status?: string | null
    subscription_ends_at?: string | null
  },
  services: Array<{
    name: string
    description: string | null
    price: number | null
    base_price: number | null
    pricing_model: string | null
    variations: unknown
    duration_minutes: number | null
    base_duration?: number | null
    estimated_duration?: number | null
    whats_included: unknown
  }>
): string {
  const baseUrl = getAppBaseUrl()
  const bookingPath = `/${business.subdomain}/book`
  const bookingUrl = `${baseUrl}${bookingPath}`

  const serviceLines = services.map((s) => {
    const basePrice = Number(s.base_price) || Number(s.price) || 0
    const fromPrice = getStartingPrice({
      pricing_model: s.pricing_model as 'flat' | 'variable' | undefined,
      base_price: basePrice,
      price: s.price != null ? Number(s.price) : undefined,
      variations: s.variations as Record<string, { price: number; duration: number; enabled: boolean }> | undefined,
    })
    const mins = serviceDurationMinutes(s)
    const included =
      s.whats_included != null ? truncateJson(s.whats_included, 400) : '—'
    const desc = s.description?.trim() ? s.description.trim().slice(0, 200) : ''
    return `- ${s.name}: from $${fromPrice.toFixed(2)}, ~${mins || '—'} mins. Included: ${included}${desc ? `. ${desc}` : ''}`
  })

  const hoursText =
    business.business_hours != null
      ? truncateJson(business.business_hours, 2000)
      : 'Not specified'

  const tier = getTierFromBusiness(
    {
      billing_plan: business.billing_plan,
      subscription_plan: (business as { subscription_plan?: string | null }).subscription_plan,
      subscription_status: (business as { subscription_status?: string | null }).subscription_status,
      subscription_ends_at: (business as { subscription_ends_at?: string | null }).subscription_ends_at,
    },
    null
  )
  const includeBookingLinks = tier === 'pro' || tier === 'fleet'

  const base = `You are an AI assistant for ${business.name}, a mobile detailing business.

Services offered:
${serviceLines.length ? serviceLines.join('\n') : '(No services listed)'}

Business hours: ${hoursText}

You can answer questions about pricing, services, and general information. Be friendly, concise, and helpful. Do not invent services or prices that are not listed above.`

  if (includeBookingLinks) {
    return `${base}

This business is on the Pro plan. You may help customers understand how to get a quote and how to book. When directing customers to book, format the link as markdown using this exact URL: [Book Now](${bookingUrl})
Do not paste the raw URL alone; always use that markdown hyperlink form so it renders as a clickable link. You may summarize quote-related questions using the service list above; direct them to book online for final pricing and availability.`
  }

  return `${base}

Do not provide booking links or quote-generation workflows. If the customer wants to book or get a formal quote, politely say they should contact the business directly (phone, email, or website if known from context). Do not invent a booking URL.`
}

/** Anthropic requires the first message in messages[] to be from the user. */
function toAnthropicMessages(
  raw: Array<{ role: string; content: string }>
): { role: 'user' | 'assistant'; content: string }[] {
  const cleaned = raw
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_CONTENT_LEN),
    }))

  let start = 0
  while (start < cleaned.length && cleaned[start].role !== 'user') {
    start++
  }
  const sliced = cleaned.slice(start)
  const merged: { role: 'user' | 'assistant'; content: string }[] = []
  for (const m of sliced) {
    const last = merged[merged.length - 1]
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`.slice(0, MAX_CONTENT_LEN * 2)
    } else {
      merged.push({ ...m })
    }
  }
  return merged
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured (missing ANTHROPIC_API_KEY).' },
      { status: 503 }
    )
  }

  const supabase = getServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  let body: { businessId?: string; messages?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : ''
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const rawMessages = body.messages.slice(-MAX_MESSAGES) as Array<{ role: string; content: string }>
  const anthropicMessages = toAnthropicMessages(rawMessages)

  if (anthropicMessages.length === 0) {
    return NextResponse.json({ error: 'At least one user message is required' }, { status: 400 })
  }

  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select(
      'id, name, subdomain, business_hours, billing_plan, subscription_plan, subscription_status, subscription_ends_at'
    )
    .eq('id', businessId)
    .single()

  if (bizErr || !business || business.id !== businessId) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { data: servicesRaw, error: svcErr } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (svcErr?.message) {
    console.error('[ai-widget] services:', svcErr.message, svcErr.code)
  }

  const services = servicesRaw || []

  const tier = getTierFromBusiness(
    {
      billing_plan: business.billing_plan,
      subscription_plan: business.subscription_plan,
      subscription_status: business.subscription_status,
      subscription_ends_at: business.subscription_ends_at,
    },
    null
  )
  if (tier !== 'pro' && tier !== 'fleet') {
    return NextResponse.json(
      { error: 'AI chat is available on Pro and Fleet plans only.' },
      { status: 403 }
    )
  }

  const system = buildSystemPrompt(
    {
      name: business.name,
      subdomain: business.subdomain,
      business_hours: business.business_hours,
      billing_plan: business.billing_plan,
      subscription_plan: business.subscription_plan,
      subscription_status: business.subscription_status,
      subscription_ends_at: business.subscription_ends_at,
    },
    services
  )

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: anthropicMessages,
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('[ai-widget] Anthropic error:', anthropicRes.status, errText)
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable. Please try again.' },
      { status: 502 }
    )
  }

  const data = (await anthropicRes.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const text =
    (data.content ?? []).find((c) => c.type === 'text')?.text?.trim() ?? ''

  if (!text) {
    return NextResponse.json({ error: 'Empty assistant response' }, { status: 502 })
  }

  return NextResponse.json({ text })
}
