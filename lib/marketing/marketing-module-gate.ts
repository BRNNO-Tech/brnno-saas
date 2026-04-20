import type { User } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'
import { moduleApiGateResponse } from '@/lib/subscription/module-api-gate'

export async function marketingModuleGateResponse(user: User | null): Promise<NextResponse | null> {
  return moduleApiGateResponse(user, 'marketing')
}
