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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthAndBusiness()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, business } = auth
    const { id } = await params
    const { data: template } = await supabase
      .from('checklist_templates')
      .select('id, business_id')
      .eq('id', id)
      .single()
    if (!template || template.business_id !== business.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting checklist template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete template' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthAndBusiness()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, business } = auth
    const { id } = await params
    const { data: template } = await supabase
      .from('checklist_templates')
      .select('id, business_id')
      .eq('id', id)
      .single()
    if (!template || template.business_id !== business.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    const body = await request.json()
    const { service_name, items } = body as { service_name?: string; items?: Array<{ item_type: string; inventory_item_id: string | null; item_name: string; estimated_quantity: number | null }> }
    if (service_name != null && typeof service_name === 'string') {
      const { error: updateError } = await supabase
        .from('checklist_templates')
        .update({ service_name: service_name.trim() })
        .eq('id', id)
      if (updateError) throw updateError
    }
    if (Array.isArray(items)) {
      const { error: deleteItemsError } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('template_id', id)
      if (deleteItemsError) throw deleteItemsError
      if (items.length > 0) {
        const rows = items.map((it, i) => ({
          template_id: id,
          item_type: it.item_type ?? 'task',
          inventory_item_id: it.inventory_item_id || null,
          item_name: (it.item_name ?? '').trim() || 'Item',
          estimated_quantity: it.estimated_quantity ?? null,
          is_required: true,
          sort_order: i,
        }))
        const { error: insertError } = await supabase
          .from('checklist_template_items')
          .insert(rows)
        if (insertError) throw insertError
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error updating checklist template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update template' },
      { status: 500 }
    )
  }
}
