import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { countAudience } from '@/lib/marketing/audience'
import { marketingModuleGateResponse } from '@/lib/marketing/marketing-module-gate'
import type { AudienceFilter } from '@/types/marketing'

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

    const gate = await marketingModuleGateResponse(user)
    if (gate) return gate

    let body: { audience_filter?: AudienceFilter; channel?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const channel = body.channel === 'sms' ? 'sms' : 'email'
    const audience_filter = (body.audience_filter || {}) as AudienceFilter

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

    const n = await countAudience(supabase, business.id, audience_filter, channel)
    return NextResponse.json({ count: n })
  } catch (e) {
    console.error('[campaigns preview]', e)
    return NextResponse.json({ error: 'Failed to preview audience' }, { status: 500 })
  }
}
