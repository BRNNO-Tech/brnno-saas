/** Stored in businesses.condition_config (JSONB) */
export type ConditionTier = {
  id: string
  label: string
  description: string
  markup_percent: number
  /** Public Supabase Storage URLs for detailer reference examples (max 2 in UI) */
  reference_photos?: string[]
}

export type ConditionConfig = {
  enabled: boolean
  tiers: ConditionTier[]
}
