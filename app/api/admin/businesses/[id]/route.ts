import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service-client'
import { isAdminEmail } from '@/lib/permissions'

/**
 * PATCH /api/admin/businesses/[id] — update a business (admin only, bypasses RLS via service role).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  const isAdmin = !!adminRow || isAdminEmail(user.email)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const allowed = [
    'billing_plan',
    'billing_interval',
    'subscription_plan',
    'subscription_status',
    'modules',
  ] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key]
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No allowed fields to update' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
