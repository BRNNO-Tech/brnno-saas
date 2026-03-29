import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const VIBES = ['professional', 'hype', 'chill', 'funny'] as const

function parseCaptionsJson(text: string): string[] {
  const trimmed = text.trim()
  let raw = trimmed
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed)
  if (fence) raw = fence[1].trim()
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed.slice(0, 3)
    }
  } catch {
    /* fall through */
  }
  const arrMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0])
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        return parsed.slice(0, 3)
      }
    } catch {
      /* ignore */
    }
  }
  throw new Error('Could not parse captions from model response')
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      serviceType?: string
      vehicleType?: string
      vibe?: string
      hasPhoto?: boolean
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const serviceType = typeof body.serviceType === 'string' ? body.serviceType.trim() : ''
    if (!serviceType) {
      return NextResponse.json({ error: 'serviceType is required' }, { status: 400 })
    }

    const vibeRaw = typeof body.vibe === 'string' ? body.vibe.trim().toLowerCase() : ''
    if (!vibeRaw || !VIBES.includes(vibeRaw as (typeof VIBES)[number])) {
      return NextResponse.json(
        { error: `vibe must be one of: ${VIBES.join(', ')}` },
        { status: 400 }
      )
    }
    const vibe = vibeRaw as (typeof VIBES)[number]

    const vehicleType =
      typeof body.vehicleType === 'string' && body.vehicleType.trim()
        ? body.vehicleType.trim()
        : undefined
    const hasPhoto = Boolean(body.hasPhoto)

    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const clientSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await clientSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Caption generator is not configured (missing ANTHROPIC_API_KEY).' },
        { status: 503 }
      )
    }

    const prompt = `You are a social media copywriter for a mobile auto detailing business.
Generate exactly 3 Instagram/Facebook captions for the following:

Service: ${serviceType}
Vehicle: ${vehicleType || 'not specified'}
Tone: ${vibe}
${hasPhoto ? 'A before/after photo will be attached.' : ''}

Rules:
- Each caption should be 1-3 sentences + relevant emojis
- Include a CTA (book now, link in bio, DM us, etc.)
- Make them sound like a real detailer, not a corporation
- Return ONLY a JSON array of 3 strings, no markdown, no preamble

Example format: ["caption 1", "caption 2", "caption 3"]`

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
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[caption-generator] Anthropic error:', anthropicRes.status, errText)
      return NextResponse.json(
        { error: 'Caption generation failed. Please try again.' },
        { status: 502 }
      )
    }

    const data = (await anthropicRes.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const text =
      (data.content ?? []).find((c) => c.type === 'text')?.text?.trim() ?? ''

    if (!text) {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 })
    }

    let captions: string[]
    try {
      captions = parseCaptionsJson(text)
    } catch (e) {
      console.error('[caption-generator] parse:', text.slice(0, 500), e)
      return NextResponse.json(
        { error: 'Could not parse captions. Try again or shorten inputs.' },
        { status: 502 }
      )
    }

    if (captions.length < 3) {
      while (captions.length < 3) captions.push('')
    }

    const out = captions.slice(0, 3)
    try {
      await supabase.from('caption_generations').insert({
        business_id: business.id,
        service_type: serviceType,
        prompt_used: prompt.slice(0, 8000),
        captions: out,
      })
    } catch (histErr) {
      console.warn('[caption-generator] history insert:', histErr)
    }

    return NextResponse.json({ captions: out })
  } catch (error) {
    console.error('[caption-generator]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
