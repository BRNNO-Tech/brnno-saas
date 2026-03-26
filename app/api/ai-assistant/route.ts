import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service-client'
import {
  buildBootstrapGreeting,
  buildDemoAssistantSnapshot,
  buildSystemPrompt,
  fetchAssistantSnapshot,
} from '@/lib/ai-assistant/snapshot'
import { sliceMessages, toAnthropicMessages } from '@/lib/ai/anthropic-messages'
import { MOCK_BUSINESS } from '@/lib/demo/mock-data'

const DEMO_COOKIE = 'demo-mode'

export async function POST(request: NextRequest) {
  let body: {
    messages?: unknown
    businessId?: string
    bootstrap?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const businessIdRaw = typeof body.businessId === 'string' ? body.businessId.trim() : ''
  if (!businessIdRaw) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const isDemo = cookieStore.get(DEMO_COOKIE)?.value === 'true'

  if (isDemo) {
    if (businessIdRaw !== MOCK_BUSINESS.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    const supabaseUser = await createClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: owned, error: ownErr } = await supabaseUser
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (ownErr || !owned?.id || owned.id !== businessIdRaw) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let snapshot
  try {
    if (isDemo) {
      snapshot = buildDemoAssistantSnapshot()
    } else {
      const supabase = createServiceClient()
      snapshot = await fetchAssistantSnapshot(supabase, businessIdRaw)
    }
  } catch (e) {
    console.error('[ai-assistant] snapshot:', e)
    return NextResponse.json({ error: 'Failed to load business context' }, { status: 500 })
  }

  const system = buildSystemPrompt(snapshot)

  if (body.bootstrap === true) {
    const greeting = buildBootstrapGreeting(snapshot)
    return NextResponse.json({ response: greeting })
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const rawMessages = sliceMessages(
    body.messages as Array<{ role: string; content: string }>
  )
  const anthropicMessages = toAnthropicMessages(rawMessages)

  if (anthropicMessages.length === 0) {
    return NextResponse.json({ error: 'At least one user message is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured (missing ANTHROPIC_API_KEY).' },
      { status: 503 }
    )
  }

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
    console.error('[ai-assistant] Anthropic error:', anthropicRes.status, errText)
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

  return NextResponse.json({ response: text })
}
