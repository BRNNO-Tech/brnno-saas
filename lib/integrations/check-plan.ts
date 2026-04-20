import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccess } from '@/lib/permissions'

/**
 * Meta lead ads / integrations: require Marketing Suite module (not just Pro plan).
 * Pass owner email when known so admin bypass works; webhook callers may pass null.
 */
export async function isIntegrationAllowed(
  supabase: SupabaseClient,
  businessId: string,
  userEmail?: string | null
): Promise<boolean> {
  const { data } = await supabase
    .from('businesses')
    .select('modules, billing_plan, subscription_plan, subscription_status, subscription_ends_at')
    .eq('id', businessId)
    .single()

  if (!data) return false
  return canAccess(data, userEmail ?? null, 'marketing')
}
