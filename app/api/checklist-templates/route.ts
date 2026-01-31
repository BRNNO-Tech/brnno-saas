import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getAuthAndBusiness() {
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
  const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' as const, status: 401 }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: 'Server configuration error' as const, status: 500 }
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!business) {
    return { error: 'Business not found' as const, status: 404 }
  }
  return { supabase, business }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthAndBusiness()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, business } = auth
    const body = await request.json()
    const { service_name, items } = body as { service_name?: string; items?: Array<{ item_type: string; inventory_item_id: string | null; item_name: string; estimated_quantity: number | null }> }
    if (!service_name || typeof service_name !== 'string' || !service_name.trim()) {
      return NextResponse.json({ error: 'service_name is required' }, { status: 400 })
    }
    const itemList = Array.isArray(items) ? items : []
    const { data: template, error: templateError } = await supabase
      .from('checklist_templates')
      .insert({ business_id: business.id, service_name: service_name.trim() })
      .select()
      .single()
    if (templateError) throw templateError
    if (itemList.length > 0) {
      const rows = itemList.map((it, i) => ({
        template_id: template.id,
        item_type: it.item_type ?? 'task',
        inventory_item_id: it.inventory_item_id || null,
        item_name: (it.item_name ?? '').trim() || 'Item',
        estimated_quantity: it.estimated_quantity ?? null,
        is_required: true,
        sort_order: i,
      }))
      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(rows)
      if (itemsError) throw itemsError
    }
    return NextResponse.json({ success: true, template })
  } catch (error: unknown) {
    console.error('Error creating checklist template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    )
  }
}
