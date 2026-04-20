import type { User } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canAccess, isAdminEmail } from '@/lib/permissions'

/**
 * For marketing-module APIs: return a NextResponse to reject the request, or null if allowed.
 */
export async function marketingModuleGateResponse(user: User | null): Promise<NextResponse | null> {
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.email && isAdminEmail(user.email)) {
    return null
  }
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return null
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: business, error } = await supabase
    .from('businesses')
    .select('modules, billing_plan, subscription_plan, subscription_status, subscription_ends_at')
    .eq('owner_id', user.id)
    .single()
  if (error || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }
  if (!canAccess(business, user.email ?? null, 'marketing')) {
    return NextResponse.json(
      { error: 'Marketing module required', code: 'MARKETING_MODULE_REQUIRED' },
      { status: 403 }
    )
  }
  return null
}
