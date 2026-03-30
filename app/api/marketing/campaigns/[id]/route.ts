import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getAuthContext() {
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
  } = await clientSupabase.auth.getUser()
  if (!user) return { user: null as null, supabase: null as null, businessId: null as null }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return { user, supabase: null, businessId: null }
  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  return { user, supabase, businessId: business?.id ?? null }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const ctx = await getAuthContext()
    if (!ctx.user || !ctx.supabase || !ctx.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: campaign, error } = await ctx.supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('business_id', ctx.businessId)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: recipients } = await ctx.supabase
      .from('campaign_recipients')
      .select('id, client_id, status, sent_at, error, created_at')
      .eq('campaign_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ campaign, recipients: recipients || [] })
  } catch (e) {
    console.error('[campaign GET]', e)
    return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const ctx = await getAuthContext()
    if (!ctx.user || !ctx.supabase || !ctx.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing } = await ctx.supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('business_id', ctx.businessId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.status === 'sent') {
      return NextResponse.json({ error: 'Cannot edit a sent campaign' }, { status: 400 })
    }

    let body: {
      name?: string
      subject?: string | null
      body?: string
      audience_filter?: Record<string, unknown>
      channel?: string
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (body.subject !== undefined) updates.subject = body.subject
    if (typeof body.body === 'string') updates.body = body.body
    if (body.audience_filter && typeof body.audience_filter === 'object') {
      updates.audience_filter = body.audience_filter
    }
    if (body.channel === 'email' || body.channel === 'sms') updates.channel = body.channel

    const { data: row, error } = await ctx.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('business_id', ctx.businessId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ campaign: row })
  } catch (e) {
    console.error('[campaign PATCH]', e)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const ctx = await getAuthContext()
    if (!ctx.user || !ctx.supabase || !ctx.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await ctx.supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('business_id', ctx.businessId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[campaign DELETE]', e)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
