'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Gets the current user's business ID
 * Used across all server actions to avoid duplication
 */
export async function getBusinessId() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  
  if (!business) throw new Error('No business found')
  
  return business.id
}

