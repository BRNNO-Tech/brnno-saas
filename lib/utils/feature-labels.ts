import { MASTER_FEATURES } from '@/lib/features/master-features'

/**
 * Maps feature IDs to their display labels
 * @param featureId - The feature ID (e.g., "int_vac", "ext_wash")
 * @returns The display label or the original ID if not found
 */
export function getFeatureLabel(featureId: string): string {
  // Search through all categories and options
  for (const category of MASTER_FEATURES) {
    const feature = category.options.find(opt => opt.id === featureId)
    if (feature) {
      return feature.label
    }
  }
  // If not found, return the original ID (fallback)
  return featureId
}

/**
 * Maps an array of feature IDs to their display labels
 * @param featureIds - Array of feature IDs
 * @returns Array of display labels
 */
export function getFeatureLabels(featureIds: string[]): string[] {
  return featureIds.map(id => getFeatureLabel(id))
}
