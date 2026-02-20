'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import type { FeatureCategory } from '@/lib/features/master-features'
import { MASTER_FEATURES } from '@/lib/features/master-features'
import { revalidatePath } from 'next/cache'

/**
 * Get the business's custom "What's Included" config (exterior/interior options).
 * Returns MASTER_FEATURES when no custom config is set.
 */
export async function getServiceFeatureConfig(): Promise<FeatureCategory[]> {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) return MASTER_FEATURES

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('businesses')
    .select('service_feature_categories')
    .eq('id', businessId)
    .single()

  if (error || !data?.service_feature_categories) {
    return MASTER_FEATURES
  }

  const parsed = data.service_feature_categories as FeatureCategory[]
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return MASTER_FEATURES
  }

  return parsed
}

/**
 * Save the business's custom "What's Included" config.
 */
export async function updateServiceFeatureConfig(config: FeatureCategory[]) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { error } = await supabase
    .from('businesses')
    .update({ service_feature_categories: config })
    .eq('id', businessId)

  if (error) {
    console.error('Error updating service feature config:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/services')
}
