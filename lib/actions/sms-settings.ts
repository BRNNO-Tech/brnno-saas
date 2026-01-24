'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

/**
 * Updates SMS provider settings
 */
export async function updateSMSSettings(data: {
  sms_provider?: 'surge' | 'twilio' | null
  surge_api_key?: string | null
  surge_account_id?: string | null
  // Note: surge_phone_number is not needed - Surge SDK uses account default
  twilio_account_sid?: string | null
  // Note: twilio_auth_token and twilio_phone_number are NOT stored per-business
  // They come from environment variables (shared SaaS account)
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Build update object with only provided fields
  // Only include fields that are actually being set (not undefined)
  const updateData: Record<string, any> = {}
  
  if (data.sms_provider !== undefined) {
    updateData.sms_provider = data.sms_provider
  }
  
  if (data.surge_api_key !== undefined) {
    updateData.surge_api_key = data.surge_api_key
  }
  
  if (data.surge_account_id !== undefined) {
    updateData.surge_account_id = data.surge_account_id
  }
  
  // Note: surge_phone_number is not needed - Surge SDK uses account default phone number
  
  // Only include twilio_account_sid (optional for tracking)
  // Auth Token and Phone Number come from environment variables (shared SaaS account)
  if (data.twilio_account_sid !== undefined && data.twilio_account_sid !== null && data.twilio_account_sid !== '') {
    updateData.twilio_account_sid = data.twilio_account_sid
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true } // Nothing to update
  }

  const { error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId)

  if (error) {
    // Check if it's a column not found error (PostgreSQL error code 42703)
    const isColumnError = error.code === '42703' || 
                         error.message?.toLowerCase().includes('column') || 
                         error.message?.toLowerCase().includes('does not exist') || 
                         error.message?.toLowerCase().includes('schema cache')
    
    if (isColumnError) {
      console.warn('Column may not exist, trying update without problematic fields:', error.message)
      // Try updating without columns that might not exist yet (twilio_account_sid, surge_phone_number)
      const safeUpdateData: Record<string, any> = {}
      if (data.sms_provider !== undefined) safeUpdateData.sms_provider = data.sms_provider
      if (data.surge_api_key !== undefined) safeUpdateData.surge_api_key = data.surge_api_key
      if (data.surge_account_id !== undefined) safeUpdateData.surge_account_id = data.surge_account_id
      // Skip surge_phone_number and twilio_account_sid - they might not exist yet
      
      if (Object.keys(safeUpdateData).length > 0) {
        const { error: retryError } = await supabase
          .from('businesses')
          .update(safeUpdateData)
          .eq('id', businessId)
        
        if (retryError) {
          console.error('Error updating SMS settings (retry):', retryError)
          throw new Error(`Failed to update SMS settings: ${retryError.message}. Please run the database migration: database/add_sms_providers.sql`)
        }
        // Success with safe update
        revalidatePath('/dashboard/settings')
        return { success: true, warning: 'Some fields may not have been updated. Please run the database migration.' }
      } else {
        throw new Error(`Failed to update SMS settings: Required columns may not exist. Please run the database migration: database/add_sms_providers.sql`)
      }
    } else {
      console.error('Error updating SMS settings:', error)
      throw new Error(`Failed to update SMS settings: ${error.message}`)
    }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
