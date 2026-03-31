import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED = ['pro', 'growth', 'premium']

export async function isIntegrationAllowed(
  supabase: SupabaseClient,
  businessId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('businesses')
    .select('subscription_plan, billing_plan')
    .eq('id', businessId)
    .single()

  if (!data) return false
  const sub = (data.subscription_plan as string | null) || ''
  const bill = (data.billing_plan as string | null) || ''
  return ALLOWED.includes(sub) || ALLOWED.includes(bill)
}
