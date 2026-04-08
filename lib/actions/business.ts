'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CancellationPolicy } from '@/types/cancellation-policy'

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
    console.error('[getBusiness] Auth error:', authError.message)
    return null
  }

  if (!user) {
    return null
  }

  // Use select('*') so we don't fail on missing columns (real DB may have different schema than local)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (businessError) {
    // No rows (PGRST116) or empty result: no business yet
    if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object')) {
      return null
    }
    // Log each piece separately so we always see something (some consoles collapse objects to {})
    console.error('[getBusiness] Database error code:', businessError.code)
    console.error('[getBusiness] Database error message:', businessError.message)
    console.error('[getBusiness] Database error details:', businessError.details)
    console.error('[getBusiness] Database error hint:', businessError.hint)
    try {
      console.error('[getBusiness] Database error JSON:', JSON.stringify(businessError, null, 2))
    } catch {
      console.error('[getBusiness] Database error toString:', String(businessError))
    }
    return null
  }

  return business
}

/**
 * Saves business data (create or update).
 * Returns { success, data } or { success: false, error } so the client can show the real error instead of 500.
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
}, existingBusinessId?: string): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { success: false, error: `Authentication error: ${authError.message}` }
    }

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Auto-generate subdomain if not provided
    let finalBusinessData = { ...businessData }
    if (!finalBusinessData.subdomain || finalBusinessData.subdomain.trim() === '') {
      try {
        finalBusinessData.subdomain = await generateSubdomain(businessData.name, existingBusinessId)
      } catch (subErr) {
        console.error('[saveBusiness] generateSubdomain error:', subErr)
        return { success: false, error: 'Could not generate subdomain. Please try again.' }
      }
    }

    let result
    if (existingBusinessId) {
      result = await supabase
        .from('businesses')
        .update(finalBusinessData)
        .eq('owner_id', user.id)
        .eq('id', existingBusinessId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          ...finalBusinessData,
          subscription_plan: 'starter',
          subscription_status: 'inactive',
        })
        .select()
        .single()

      // Business already exists for this user (e.g. created by trial/signup but getBusiness returned null). Update it instead.
      const isDuplicateOwner =
        result.error &&
        (result.error.code === '23505' ||
          result.error.message?.includes('duplicate key') ||
          result.error.message?.includes('businesses_owner_id_unique'))
      if (isDuplicateOwner) {
        result = await supabase
          .from('businesses')
          .update(finalBusinessData)
          .eq('owner_id', user.id)
          .select()
          .single()
      }
    }

    if (result.error) {
      console.error('[saveBusiness] DB error:', result.error)
      return { success: false, error: result.error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/onboarding')

    return { success: true, data: result.data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[saveBusiness] Error:', msg)
    return { success: false, error: msg }
  }
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
    reference_photos?: string[]
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

/** Persist flat sales tax rate as decimal (e.g. 0.0825 for 8.25%). */
export async function updateTaxRate(taxRateDecimal: number) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const r = Number(taxRateDecimal)
  if (!Number.isFinite(r) || r < 0 || r > 1) {
    throw new Error('Tax rate must be between 0% and 100%')
  }

  const { error } = await supabase.from('businesses').update({ tax_rate: r }).eq('owner_id', user.id)

  if (error) {
    throw new Error(`Failed to save tax rate: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
}

export async function updateDepositMessage(enabled: boolean, message: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const trimmed = message?.trim() ?? ''
  if (trimmed.length > 300) {
    throw new Error('Deposit message must be 300 characters or less')
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      deposit_message_enabled: enabled,
      deposit_message: trimmed.length > 0 ? trimmed : null,
    })
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(`Failed to save deposit message: ${error.message}`)
  }

  revalidatePath('/dashboard/settings')
}

export async function updateBrandSettings(brandData: {
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

export async function updateCancellationPolicy(policy: CancellationPolicy) {
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
    .update({ cancellation_policy: policy })
    .eq('id', business.id)

  if (updateError) {
    throw new Error(`Failed to update cancellation policy: ${updateError.message}`)
  }

  revalidatePath('/dashboard/settings')
}

export async function completeOnboarding() {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/dashboard')
  }

  const { error } = await supabase
    .from('businesses')
    .update({ onboarding_completed: true })
    .eq('owner_id', user.id)

  if (error) {
    console.error('[completeOnboarding]', error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/onboarding')
  revalidatePath('/dashboard/settings')
  redirect('/dashboard')
}

/**
 * Persist public profile logo URL after /api/upload-profile-logo (e.g. onboarding).
 */
export async function setProfileLogoUrl(
  url: string
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmed = url.trim()
  if (!trimmed) {
    return { success: false, error: 'Logo URL is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    return { success: false, error: 'Business not found' }
  }

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_id', business.id)
    .maybeSingle()

  const { error: writeError } = profile
    ? await supabase.from('business_profiles').update({ logo_url: trimmed }).eq('business_id', business.id)
    : await supabase.from('business_profiles').insert({ business_id: business.id, logo_url: trimmed })

  if (writeError) {
    console.error('[setProfileLogoUrl]', writeError.message)
    return { success: false, error: writeError.message }
  }

  revalidatePath('/dashboard/onboarding')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveOnboardingProfile(data: {
  tagline?: string | null
  primaryColor?: string | null
  ownerStory?: string | null
  /** Set only when a new logo was uploaded in the Profile step; otherwise existing DB value is kept. */
  logoUrl?: string | null
  /** Set only when a new profile banner was uploaded in the Profile step; otherwise existing DB value is kept. */
  bannerUrl?: string | null
}): Promise<{ success: true } | { success: false; error: string }> {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    return { success: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    return { success: false, error: 'Business not found' }
  }

  const { data: existing } = await supabase
    .from('business_profiles')
    .select('logo_url, banner_url, tagline, primary_color, owner_story')
    .eq('business_id', business.id)
    .maybeSingle()

  const trimmedLogo =
    data.logoUrl !== undefined && data.logoUrl !== null && String(data.logoUrl).trim() !== ''
      ? String(data.logoUrl).trim()
      : null
  const trimmedBanner =
    data.bannerUrl !== undefined && data.bannerUrl !== null && String(data.bannerUrl).trim() !== ''
      ? String(data.bannerUrl).trim()
      : null

  const logo_url = trimmedLogo ?? existing?.logo_url ?? null
  const banner_url = trimmedBanner ?? existing?.banner_url ?? null

  const tagline =
    data.tagline !== undefined
      ? data.tagline === null
        ? null
        : data.tagline.trim() || null
      : existing?.tagline ?? null
  const owner_story =
    data.ownerStory !== undefined
      ? data.ownerStory === null
        ? null
        : data.ownerStory.trim() || null
      : existing?.owner_story ?? null
  const primary_color =
    data.primaryColor !== undefined && data.primaryColor !== null && data.primaryColor.trim() !== ''
      ? data.primaryColor.trim()
      : existing?.primary_color?.trim() || '#F2C94C'

  const patch = {
    business_id: business.id,
    tagline,
    primary_color,
    owner_story,
    logo_url,
    banner_url,
  }

  const { error: upsertError } = await supabase
    .from('business_profiles')
    .upsert(patch, { onConflict: 'business_id' })

  if (upsertError) {
    console.error('[saveOnboardingProfile]', upsertError.message)
    return { success: false, error: upsertError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/onboarding')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
