import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// PUT - Update discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user owns the business that owns this discount code
    const { data: discountCode } = await supabase
      .from('discount_codes')
      .select('business_id, businesses!inner(owner_id)')
      .eq('id', id)
      .single()

    if (!discountCode || (discountCode.businesses as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.discountPercent !== undefined) updateData.discount_percent = body.discountPercent
    if (body.description !== undefined) updateData.description = body.description
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.usageLimit !== undefined) updateData.usage_limit = body.usageLimit
    if (body.validUntil !== undefined) updateData.valid_until = body.validUntil

    const { data: updated, error } = await supabase
      .from('discount_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ discountCode: updated })
  } catch (error: any) {
    console.error('Error updating discount code:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user owns the business
    const { data: discountCode } = await supabase
      .from('discount_codes')
      .select('business_id, businesses!inner(owner_id)')
      .eq('id', id)
      .single()

    if (!discountCode || (discountCode.businesses as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}