'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Generates a URL-friendly subdomain from a business name
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
function generateSubdomainSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generates a unique subdomain for a business
 * Checks database for existing subdomains and appends number if needed
 */
async function generateSubdomain(name: string, excludeBusinessId?: string): Promise<string> {
  const supabase = await createClient()

  const baseSubdomain = generateSubdomainSlug(name)

  // If base subdomain is empty (all special chars), use a fallback
  if (!baseSubdomain) {
    return `business-${Date.now()}`
  }

  // Check if subdomain exists
  let query = supabase
    .from('businesses')
    .select('id')
    .eq('subdomain', baseSubdomain)

  if (excludeBusinessId) {
    query = query.neq('id', excludeBusinessId)
  }

  const { data: existing } = await query

  // If subdomain is available, return it
  if (!existing || existing.length === 0) {
    return baseSubdomain
  }

  // If exists, try with numbers appended
  for (let i = 2; i <= 100; i++) {
    const candidateSubdomain = `${baseSubdomain}-${i}`

    let checkQuery = supabase
      .from('businesses')
      .select('id')
      .eq('subdomain', candidateSubdomain)

    if (excludeBusinessId) {
      checkQuery = checkQuery.neq('id', excludeBusinessId)
    }

    const { data: existingCandidate } = await checkQuery

    if (!existingCandidate || existingCandidate.length === 0) {
      return candidateSubdomain
    }
  }

  // Fallback to timestamp if all attempts fail
  return `${baseSubdomain}-${Date.now()}`
}

/**
 * Gets the current user's business data
 * Server-side action to avoid 406 errors
 */
export async function getBusiness() {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  const { MOCK_BUSINESS } = await import('@/lib/demo/mock-data')

  if (await isDemoMode()) {
    return MOCK_BUSINESS
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    return null
  }

  // Include subscription fields needed for permissions checks and condition config
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, owner_id, created_at, subscription_plan, subscription_status, subscription_ends_at, condition_config, address, city, state, zip, phone, email, website, description, subdomain, sms_provider, surge_api_key, surge_account_id, twilio_account_sid, twilio_auth_token, twilio_phone_number')
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
  subdomain?: string | null
}, existingBusinessId?: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Auto-generate subdomain if not provided
  let finalBusinessData = { ...businessData }
  if (!finalBusinessData.subdomain || finalBusinessData.subdomain.trim() === '') {
    finalBusinessData.subdomain = await generateSubdomain(businessData.name, existingBusinessId)
  }

  let result
  if (existingBusinessId) {
    // Update existing business
    result = await supabase
      .from('businesses')
      .update(finalBusinessData)
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
        ...finalBusinessData,
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

/**
 * Uploads business logo to Supabase Storage
 */
export async function uploadBusinessLogo(file: File) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get business ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${business.id}/logo-${Date.now()}.${fileExt}`
  const filePath = `business-logos/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('business-logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Logo upload error:', error)
    throw new Error(`Failed to upload logo: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('business-logos')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Updates brand settings for a business
 */
export async function updateConditionConfig(config: {
  enabled: boolean
  tiers: Array<{
    id: string
    label: string
    description: string
    markup_percent: number
  }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('Business not found')
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ condition_config: config })
    .eq('id', business.id)

  if (updateError) {
    throw new Error(`Failed to update condition config: ${updateError.message}`)
  }

  revalidatePath('/dashboard/settings')
}

export async function uploadBookingBanner(file: File) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('Business not found')
  }

  // Get file extension
  const fileExt = file.name.split('.').pop()
  const fileName = `${business.id}/banner-${Date.now()}.${fileExt}`
  const filePath = `booking-banners/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('booking-banners')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Banner upload error:', uploadError)
    throw new Error(`Failed to upload banner: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('booking-banners')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function updateBrandSettings(brandData: {
  logo_url?: string | null
  accent_color?: string | null
  sender_name?: string | null
  default_tone?: 'friendly' | 'premium' | 'direct' | null
  booking_banner_url?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('businesses')
    .update(brandData)
    .eq('owner_id', user.id)

  if (error) {
    console.error('Error updating brand settings:', error)
    throw new Error(`Failed to update brand settings: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  return { success: true }
}
