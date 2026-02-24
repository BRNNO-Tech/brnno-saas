import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service-client'

/**
 * POST /api/link-guest-bookings
 * Links all client records matching the authenticated user's email to this user (sets user_id).
 * Called after customer sign-up so guest bookings (jobs linked via client_id) are associated.
 * Uses service-role to bypass RLS on clients.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const normalizedEmail = (user.email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    return NextResponse.json({ linked: 0 })
  }

  const serviceSupabase = createServiceClient()

  const { data: updated, error } = await serviceSupabase
    .from('clients')
    .update({ user_id: user.id })
    .ilike('email', normalizedEmail)
    .select('id')

  if (error) {
    console.error('[link-guest-bookings]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ linked: updated?.length ?? 0 })
}
