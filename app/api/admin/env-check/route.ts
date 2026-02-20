import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/permissions'

const STRIPE_ENV_KEYS = [
  'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'STRIPE_STARTER_YEARLY_PRICE_ID',
  'STRIPE_PRICE_PRO_1_2_MONTHLY',
  'STRIPE_PRICE_PRO_1_2_ANNUAL',
  'STRIPE_PRICE_PRO_3_MONTHLY',
  'STRIPE_PRICE_PRO_3_ANNUAL',
  'STRIPE_PRICE_FLEET_1_3_MONTHLY',
  'STRIPE_PRICE_FLEET_1_3_ANNUAL',
  'STRIPE_PRICE_FLEET_4_5_MONTHLY',
  'STRIPE_PRICE_FLEET_4_5_ANNUAL',
] as const

/**
 * GET /api/admin/env-check — admin-only debug: what the server sees for Stripe price env vars (no values, just set + length).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const vars: Record<string, { set: boolean; length: number }> = {}
  for (const key of STRIPE_ENV_KEYS) {
    const raw = process.env[key]
    const val = typeof raw === 'string' ? raw.trim() : ''
    vars[key] = { set: val.length > 0, length: val.length }
  }
  return NextResponse.json({
    cwd: process.cwd(),
    stripePriceVars: vars,
  })
}
