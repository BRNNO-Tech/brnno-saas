import { MASTER_FEATURES } from '@/lib/features/master-features'

export function getFeatureLabel(
  featureId: string,
  customCategories?: { options: { id: string; label: string }[] }[]
): string {
  const allCategories = [...MASTER_FEATURES, ...(customCategories ?? [])]
  for (const category of allCategories) {
    const feature = category.options.find((opt) => opt.id === featureId)
    if (feature) return feature.label
  }
  return featureId
}

export function getFeatureLabels(
  featureIds: string[],
  customCategories?: { options: { id: string; label: string }[] }[]
): string[] {
  return featureIds.map((id) => getFeatureLabel(id, customCategories))
}
