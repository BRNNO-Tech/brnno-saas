import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { data: rows, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ campaigns: rows || [] })
  } catch (e) {
    console.error('[campaigns GET]', e)
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      name?: string
      channel?: string
      subject?: string
      body?: string
      audience_filter?: Record<string, unknown>
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const channel = body.channel === 'sms' ? 'sms' : 'email'
    const subject = typeof body.subject === 'string' ? body.subject.trim() : null
    const textBody = typeof body.body === 'string' ? body.body : ''
    const audience_filter = body.audience_filter && typeof body.audience_filter === 'object' ? body.audience_filter : {}

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (channel === 'email' && !subject) {
      return NextResponse.json({ error: 'subject is required for email campaigns' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { data: row, error } = await supabase
      .from('campaigns')
      .insert({
        business_id: business.id,
        name,
        channel,
        status: 'draft',
        subject,
        body: textBody,
        audience_filter,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ campaign: row })
  } catch (e) {
    console.error('[campaigns POST]', e)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
