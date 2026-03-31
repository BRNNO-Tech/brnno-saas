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

    const limitRaw = request.nextUrl.searchParams.get('limit')
    const limit = Math.min(50, Math.max(1, parseInt(limitRaw || '20', 10) || 20))

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const { data: rows, error } = await supabase
      .from('integration_leads')
      .select('id, created_at, status, error, ad_name, client_id, meta_lead_id')
      .eq('business_id', business.id)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const list = rows || []
    const clientIds = [...new Set(list.map((r) => r.client_id).filter(Boolean))] as string[]
    let nameById = new Map<string, string | null>()
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds)
      for (const c of clients || []) {
        nameById.set(c.id, c.name)
      }
    }

    const leads = list.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      status: r.status,
      error: r.error,
      ad_name: r.ad_name,
      meta_lead_id: r.meta_lead_id,
      name: r.client_id ? nameById.get(r.client_id) ?? null : null,
    }))

    return NextResponse.json({ leads })
  } catch (e) {
    console.error('[meta leads]', e)
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
  }
}
