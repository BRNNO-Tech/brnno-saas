// Booking Photo Types

export interface BookingPhoto {
  id: string
  lead_id: string
  business_id: string
  photo_type: 'exterior' | 'interior' | 'problem_area' | 'other'
  storage_path: string
  storage_url: string
  file_size?: number
  mime_type?: string
  ai_analysis?: AIPhotoAnalysis
  ai_processed: boolean
  ai_processed_at?: string
  ai_error?: string
  uploaded_at: string
  created_at: string
}

export interface AIPhotoAnalysis {
  vehicle_visible: boolean
  condition_assessment: VehicleCondition
  detected_issues: DetectedIssue[]
  confidence: number
  reasoning: string
  vehicle_size_detected?: VehicleSize
}

export type VehicleCondition = 
  | 'lightly_dirty' 
  | 'moderately_dirty' 
  | 'heavily_soiled' 
  | 'extreme'

export type VehicleSize = 
  | 'sedan' 
  | 'suv' 
  | 'truck' 
  | 'van'

export type DetectedIssue =
  | 'pet_hair'
  | 'food_stains'
  | 'drink_stains'
  | 'mud'
  | 'dirt_buildup'
  | 'oxidation'
  | 'swirl_marks'
  | 'water_spots'
  | 'tree_sap'
  | 'bird_droppings'
  | 'salt_residue'
  | 'smoke_smell'
  | 'heavy_grime'

export interface AIAnalysisSummary {
  overall_condition: VehicleCondition
  vehicle_size_match: boolean
  vehicle_size_detected?: VehicleSize
  primary_issues: DetectedIssue[]
  recommended_pricing_tier: VehicleCondition
  pricing_adjustment: number // percentage
  photos_analyzed: number
  confidence: number
  timestamp: string
}

export interface SuggestedAddon {
  addon_id: string
  addon_name: string
  reason: DetectedIssue
  confidence: number
  priority: 'high' | 'medium' | 'low'
}

export interface LeadAIData {
  ai_vehicle_size?: VehicleSize
  ai_condition?: VehicleCondition
  ai_detected_issues: DetectedIssue[]
  ai_suggested_addons: SuggestedAddon[]
  ai_confidence_score?: number
  ai_analysis_summary?: AIAnalysisSummary
  photos_uploaded: boolean
}

// Helper functions
export function getConditionLabel(condition: VehicleCondition): string {
  const labels: Record<VehicleCondition, string> = {
    lightly_dirty: 'Lightly Dirty (Average)',
    moderately_dirty: 'Moderately Dirty',
    heavily_soiled: 'Heavily Soiled',
    extreme: 'Extreme / Sand / Disaster'
  }
  return labels[condition]
}

export function getConditionMarkup(condition: VehicleCondition): number {
  const markups: Record<VehicleCondition, number> = {
    lightly_dirty: 0,
    moderately_dirty: 15,
    heavily_soiled: 25,
    extreme: 40
  }
  return markups[condition]
}

export function getIssueLabel(issue: DetectedIssue): string {
  return issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
