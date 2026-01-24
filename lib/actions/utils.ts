'use server'

import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/utils'
import { MOCK_BUSINESS } from '@/lib/demo/mock-data'

/**
 * Gets the current user's business ID
 * Used across all server actions to avoid duplication
 */
export async function getBusinessId() {
  // Check if in demo mode
  if (await isDemoMode()) {
    return MOCK_BUSINESS.id
  }

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
    // Check if it's a "no rows" error (PGRST116)
    if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object')) {
      throw new Error('No business found. Please complete your business setup in Settings.')
    }
    throw new Error(`Database error: ${businessError.message}`)
  }

  if (!business) {
    throw new Error('No business found. Please complete your business setup in Settings.')
  }

  return business.id
}

