export type AssetField = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  required?: boolean
  placeholder?: string
}

export type IndustryConfig = {
  label: string
  assetName: string // e.g. "Car" or "Property"
  fields: AssetField[]
}

export const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  detailing: {
    label: 'Auto Detailing',
    assetName: 'Vehicle',
    fields: [
      { name: 'make', label: 'Make', type: 'text', placeholder: 'e.g. Ford', required: true },
      { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g. F-150', required: true },
      { name: 'year', label: 'Year', type: 'number', placeholder: 'e.g. 2023', required: true },
      { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Black' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] }
    ]
  },
  cleaning: {
    label: 'House Cleaning',
    assetName: 'Home',
    fields: [
      { name: 'type', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Condo'], required: true },
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true },
      { name: 'sqft', label: 'Square Footage', type: 'number' },
      { name: 'access', label: 'Entry Access', type: 'select', options: ['Key', 'Code', 'Someone will be home'] }
    ]
  },
  hvac: {
    label: 'HVAC',
    assetName: 'System',
    fields: [
      { name: 'type', label: 'System Type', type: 'select', options: ['AC', 'Furnace', 'Heat Pump', 'Boiler'], required: true },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'age', label: 'Approximate Age (Years)', type: 'number' },
      { name: 'issue', label: 'Primary Issue', type: 'text', placeholder: 'e.g. Not cooling' }
    ]
  }
}

export const DEFAULT_INDUSTRY = 'detailing'

