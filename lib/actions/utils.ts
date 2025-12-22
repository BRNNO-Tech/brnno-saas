'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Gets the current user's business ID
 * Used across all server actions to avoid duplication
 */
export async function getBusinessId() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }
  
  if (!user) {
    throw new Error('Not authenticated. Please log in to continue.')
  }
  
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  
  if (businessError) {
    throw new Error(`Database error: ${businessError.message}`)
  }
  
  if (!business) {
    throw new Error('No business found for your account. Please contact support.')
  }
  
  return business.id
}

