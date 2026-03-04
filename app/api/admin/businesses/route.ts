import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service-client'
import { isAdminEmail } from '@/lib/permissions'

const FIELDS =
  'id, name, email, owner_id, billing_plan, billing_interval, subscription_plan, subscription_status, modules, stripe_subscription_id, created_at'

/**
 * GET /api/admin/businesses — list all businesses (admin only, bypasses RLS via service role).
 */
export async function GET() {
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

  const service = createServiceClient()
  const { data, error } = await service
    .from('businesses')
    .select(FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
