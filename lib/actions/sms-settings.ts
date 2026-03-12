'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export type UpdateSMSSettingsResult =
  | { success: true; warning?: string }
  | { success: false; error: string }

/**
 * Updates SMS provider settings
 * Returns structured result so client can show errors without 500.
 */
export async function updateSMSSettings(data: {
  sms_provider?: 'surge' | 'twilio' | null
  surge_api_key?: string | null
  surge_account_id?: string | null
  // Note: surge_phone_number is not needed - Surge SDK uses account default
  twilio_account_sid?: string | null
  twilio_auth_token?: string | null
  twilio_phone_number?: string | null
}): Promise<UpdateSMSSettingsResult> {
  try {
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

  // Save Twilio credentials (businesses must bring their own)
  if (data.twilio_account_sid !== undefined) {
    updateData.twilio_account_sid = data.twilio_account_sid
  }

  if (data.twilio_auth_token !== undefined) {
    updateData.twilio_auth_token = data.twilio_auth_token
  }

  if (data.twilio_phone_number !== undefined) {
    updateData.twilio_phone_number = data.twilio_phone_number
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true } // Nothing to update
  }

  const { data: updatedRow, error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId)
    .select('id')
    .single()

  if (error) {
    // Check if it's a column not found error (PostgreSQL 42703, or PostgREST/406, or message hints)
    const isColumnError = error.code === '42703' ||
      (error as any).status === 406 ||
      error.message?.toLowerCase().includes('column') ||
      error.message?.toLowerCase().includes('does not exist') ||
      error.message?.toLowerCase().includes('schema cache')

    const hadTwilioData = data.twilio_account_sid !== undefined ||
      data.twilio_auth_token !== undefined ||
      data.twilio_phone_number !== undefined

    if (isColumnError) {
      console.warn('[updateSMSSettings] Column error (DB may need migration):', error.message, error.code, hadTwilioData ? '(user sent Twilio credentials)' : '')
      // If user was saving Twilio credentials, do not do a partial save — tell them to run migration
      if (hadTwilioData) {
        return {
          success: false,
          error: 'Twilio credentials could not be saved: the database is missing required columns. Run the migration in Supabase SQL Editor: database/add_sms_providers.sql',
        }
      }
      // Surge-only or sms_provider only: try updating without Twilio columns
      const safeUpdateData: Record<string, any> = {}
      if (data.sms_provider !== undefined) safeUpdateData.sms_provider = data.sms_provider
      if (data.surge_api_key !== undefined) safeUpdateData.surge_api_key = data.surge_api_key
      if (data.surge_account_id !== undefined) safeUpdateData.surge_account_id = data.surge_account_id

      if (Object.keys(safeUpdateData).length > 0) {
        const { error: retryError } = await supabase
          .from('businesses')
          .update(safeUpdateData)
          .eq('id', businessId)

        if (retryError) {
          console.error('Error updating SMS settings (retry):', retryError)
          return { success: false, error: `Failed to update SMS settings: ${retryError.message}. Please run the database migration: database/add_sms_providers.sql` }
        }
        revalidatePath('/dashboard/settings')
        return { success: true, warning: 'Some fields may not have been updated. Please run the database migration.' }
      }
      return { success: false, error: 'SMS/Twilio columns are missing. Please run the database migration: database/add_sms_providers.sql' }
    }
    console.error('Error updating SMS settings:', error)
    return { success: false, error: `Failed to update SMS settings: ${error.message}` }
  }

  if (!updatedRow) {
    console.error('[updateSMSSettings] Update returned no row (RLS or row missing)')
    return { success: false, error: 'Settings could not be saved. You may not have permission to update this business.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update SMS settings'
    console.error('Error updating SMS settings:', err)
    return { success: false, error: message }
  }
}
