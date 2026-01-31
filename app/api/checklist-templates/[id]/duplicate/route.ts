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

export async function POST(
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
    const { data: template, error: templateError } = await supabase
      .from('checklist_templates')
      .select('id, service_name, business_id')
      .eq('id', id)
      .eq('business_id', business.id)
      .single()
    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    const { data: existingItems } = await supabase
      .from('checklist_template_items')
      .select('item_type, inventory_item_id, item_name, estimated_quantity, sort_order')
      .eq('template_id', id)
      .order('sort_order', { ascending: true })
    const { data: newTemplate, error: insertTemplateError } = await supabase
      .from('checklist_templates')
      .insert({
        business_id: business.id,
        service_name: `${template.service_name} (Copy)`,
      })
      .select()
      .single()
    if (insertTemplateError) throw insertTemplateError
    const items = existingItems ?? []
    if (items.length > 0) {
      const rows = items.map((it, i) => ({
        template_id: newTemplate.id,
        item_type: it.item_type,
        inventory_item_id: it.inventory_item_id ?? null,
        item_name: it.item_name ?? '',
        estimated_quantity: it.estimated_quantity ?? null,
        is_required: true,
        sort_order: it.sort_order ?? i,
      }))
      const { error: insertItemsError } = await supabase
        .from('checklist_template_items')
        .insert(rows)
      if (insertItemsError) throw insertItemsError
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error duplicating checklist template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate template' },
      { status: 500 }
    )
  }
}
