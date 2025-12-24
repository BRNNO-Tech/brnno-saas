'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Gets the current user's business data
 * Server-side action to avoid 406 errors
 */
export async function getBusiness() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    return null
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (businessError) {
    // Check if it's a "no rows" error (PGRST116)
    if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object')) {
      return null // No business found - that's okay
    }
    // Log the error for debugging
    console.error('Error fetching business:', {
      code: businessError.code,
      message: businessError.message,
      details: businessError.details,
      hint: businessError.hint,
    })
    throw new Error(`Database error: ${businessError.message}`)
  }

  return business
}

/**
 * Saves business data (create or update)
 * Server-side action to ensure consistency
 */
export async function saveBusiness(businessData: {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  description?: string | null
}, existingBusinessId?: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  let result
  if (existingBusinessId) {
    // Update existing business
    result = await supabase
      .from('businesses')
      .update(businessData)
      .eq('owner_id', user.id)
      .eq('id', existingBusinessId)
      .select()
      .single()
  } else {
    // Create new business
    result = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        ...businessData,
      })
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving business:', result.error)
    throw new Error(`Failed to save business: ${result.error.message}`)
  }

  // Revalidate paths to ensure fresh data
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  return result.data
}
