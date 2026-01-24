/**
 * Smart Onboarding: Geography-based Condition Pricing Defaults
 * 
 * Automatically sets condition pricing defaults based on business location
 * to provide regionally-appropriate descriptions (e.g., "Winter Salt" for NY,
 * "Sand & Surf" for FL, "Red Clay Mud" for UT).
 */

// Define regional templates for the "extreme" condition tier
const TEMPLATES = {
  rust_belt: {
    label: "Winter Salt & Grime",
    desc: "Heavy road salt accumulation, slush, and hardened city grime."
  },
  beach: {
    label: "Sand & Surf",
    desc: "Deep sand extraction, salt spray residue, and damp upholstery."
  },
  mountain: {
    label: "Mud & Mountain",
    desc: "Red clay mud, pine needles, road salt, or off-road debris."
  },
  bugs_sun: {
    label: "Bugs & Sun",
    desc: "Baked-on bug splatter, tar, or heavy dust accumulation."
  },
  generic: {
    label: "Disaster Detail",
    desc: "Heavy staining, mold, biological waste, or construction dust."
  }
}

// Map US State codes to regional templates
const STATE_MAP: Record<string, keyof typeof TEMPLATES> = {
  // Rust Belt / Winter States
  'NY': 'rust_belt',
  'IL': 'rust_belt',
  'MI': 'rust_belt',
  'OH': 'rust_belt',
  'PA': 'rust_belt',
  'MN': 'rust_belt',
  'WI': 'rust_belt',
  'IN': 'rust_belt',
  'MA': 'rust_belt',
  'CT': 'rust_belt',
  'RI': 'rust_belt',
  'VT': 'rust_belt',
  'NH': 'rust_belt',
  'ME': 'rust_belt',
  
  // Beach / Coastal States
  'FL': 'beach',
  'CA': 'beach',
  'HI': 'beach',
  'SC': 'beach',
  'NC': 'beach',
  'GA': 'beach',
  'AL': 'beach',
  'MS': 'beach',
  'LA': 'beach',
  
  // Mountain / Rockies / PNW
  'UT': 'mountain',
  'CO': 'mountain',
  'OR': 'mountain',
  'WA': 'mountain',
  'ID': 'mountain',
  'MT': 'mountain',
  'WY': 'mountain',
  'NV': 'mountain',
  
  // Bugs & Sun / Hot States (desert/southern states)
  'TX': 'bugs_sun', // Hot state with bugs and sun
  'AZ': 'bugs_sun', // Desert state
  'NM': 'bugs_sun',
  'OK': 'bugs_sun',
  'AR': 'bugs_sun',
  'TN': 'bugs_sun',
  'KY': 'bugs_sun',
  'MO': 'bugs_sun',
  'KS': 'bugs_sun',
  'NE': 'bugs_sun',
  'IA': 'bugs_sun',
  'SD': 'bugs_sun',
  'ND': 'bugs_sun',
}

/**
 * Normalizes state input to uppercase 2-letter code
 * Handles both "Utah" and "UT" formats
 */
function normalizeStateCode(state: string | null | undefined): string | null {
  if (!state) return null
  
  const normalized = state.trim().toUpperCase()
  
  // If already a 2-letter code, return it
  if (normalized.length === 2) {
    return normalized
  }
  
  // Map full state names to codes (common ones)
  const stateNameMap: Record<string, string> = {
    'UTAH': 'UT',
    'COLORADO': 'CO',
    'CALIFORNIA': 'CA',
    'FLORIDA': 'FL',
    'NEW YORK': 'NY',
    'ILLINOIS': 'IL',
    'MICHIGAN': 'MI',
    'OHIO': 'OH',
    'PENNSYLVANIA': 'PA',
    'TEXAS': 'TX',
    'ARIZONA': 'AZ',
    'OREGON': 'OR',
    'WASHINGTON': 'WA',
    'IDAHO': 'ID',
    'MONTANA': 'MT',
    'WYOMING': 'WY',
    'NEVADA': 'NV',
    'NEW MEXICO': 'NM',
    'SOUTH CAROLINA': 'SC',
    'NORTH CAROLINA': 'NC',
    'GEORGIA': 'GA',
    'ALABAMA': 'AL',
    'MISSISSIPPI': 'MS',
    'LOUISIANA': 'LA',
    'MINNESOTA': 'MN',
    'WISCONSIN': 'WI',
    'INDIANA': 'IN',
    'MASSACHUSETTS': 'MA',
    'CONNECTICUT': 'CT',
    'RHODE ISLAND': 'RI',
    'VERMONT': 'VT',
    'NEW HAMPSHIRE': 'NH',
    'MAINE': 'ME',
  }
  
  return stateNameMap[normalized] || normalized
}

/**
 * Gets the initial condition config based on business location
 * 
 * @param stateCode - US state code (e.g., "UT", "NY", "FL") or full name
 * @returns Condition config object ready to save to database
 */
export function getInitialConditionConfig(stateCode: string | null | undefined): {
  enabled: boolean
  tiers: Array<{
    id: string
    label: string
    description: string
    markup_percent: number
  }>
} {
  // Normalize state code
  const code = normalizeStateCode(stateCode)
  
  // Find the template key (default to generic if not found)
  const templateKey = code ? (STATE_MAP[code] || 'generic') : 'generic'
  const template = TEMPLATES[templateKey]

  // Return the full JSON object to save to DB
  return {
    enabled: true, // Enable by default for new businesses
    tiers: [
      {
        id: "clean",
        label: "Well Maintained",
        description: "Regularly cleaned. Dust and light crumbs only.",
        markup_percent: 0
      },
      {
        id: "moderate",
        label: "Daily Driver",
        description: "Standard messes. Cup holder spills, crumbs, mild dirt.",
        markup_percent: 0.15
      },
      {
        id: "heavy",
        label: "Heavily Dirty",
        description: "Stains, pet hair, sticky residue, or strong odors.",
        markup_percent: 0.25
      },
      {
        id: "extreme",
        label: template.label, // <--- DYNAMIC INSERTION based on location
        description: template.desc, // <--- DYNAMIC INSERTION based on location
        markup_percent: 0.40
      }
    ]
  }
}

/**
 * Gets condition config for existing businesses that don't have it set
 * Useful for migration or when updating business settings
 */
export function getDefaultConditionConfig(): ReturnType<typeof getInitialConditionConfig> {
  return getInitialConditionConfig(null) // Returns generic template
}
