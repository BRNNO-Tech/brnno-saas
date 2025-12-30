'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INDUSTRY_CONFIGS, DEFAULT_INDUSTRY } from '@/lib/config/industry-assets'
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from '@/lib/data/vehicles'

export default function AssetDetailsForm({
  industry = DEFAULT_INDUSTRY,
  onChange
}: {
  industry?: string
  onChange: (data: any) => void
}) {
  const config = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS[DEFAULT_INDUSTRY]
  const [selectedMake, setSelectedMake] = useState('')
  
  // Enhanced select styling for visibility
  const selectClassName = "flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-zinc-50"
  
  // Special handling for detailing industry with vehicle dropdowns
  if (industry === 'detailing') {
    return (
      <div className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Make Dropdown */}
          <div>
            <Label htmlFor="asset_make" className="mb-2 block">Make *</Label>
            <select
              id="asset_make"
              name="asset_make"
              required
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className={selectClassName}
            >
              <option value="">Select Make...</option>
              {VEHICLE_MAKES.map(make => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {/* Model Dropdown (filtered by make) */}
          <div>
            <Label htmlFor="asset_model" className="mb-2 block">Model *</Label>
            <select
              id="asset_model"
              name="asset_model"
              required
              disabled={!selectedMake}
              className={selectClassName}
            >
              <option value="">{selectedMake ? 'Select Model...' : 'Select Make first'}</option>
              {selectedMake && VEHICLE_MODELS[selectedMake]?.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
              {selectedMake === 'Other' && (
                <option value="Other">Other (specify in notes)</option>
              )}
            </select>
          </div>

          {/* Year Dropdown */}
          <div>
            <Label htmlFor="asset_year" className="mb-2 block">Year *</Label>
            <select
              id="asset_year"
              name="asset_year"
              required
              className={selectClassName}
            >
              <option value="">Select Year...</option>
              {VEHICLE_YEARS.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Color (text input) */}
          <div>
            <Label htmlFor="asset_color" className="mb-2 block">Color</Label>
            <Input
              id="asset_color"
              name="asset_color"
              type="text"
              placeholder="e.g. Black"
            />
          </div>

          {/* Condition Dropdown */}
          <div>
            <Label htmlFor="asset_condition" className="mb-2 block">Condition</Label>
            <select
              id="asset_condition"
              name="asset_condition"
              className={selectClassName}
            >
              <option value="">Select Condition...</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to original dynamic form for other industries
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        {config.assetName} Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={`asset_${field.name}`} className="mb-2 block">
              {field.label} {field.required && '*'}
            </Label>
            
            {field.type === 'select' ? (
              <select
                id={`asset_${field.name}`}
                name={`asset_${field.name}`}
                required={field.required}
                className={selectClassName}
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Input
                id={`asset_${field.name}`}
                name={`asset_${field.name}`}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

