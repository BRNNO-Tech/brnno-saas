'use client'

import { useState, useEffect } from 'react'
import { Clock, DollarSign } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export const VEHICLE_TYPES = [
  { id: 'coupe', label: 'Coupe / Small' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'Small SUV (2 Rows)' },
  { id: 'truck', label: 'Truck / Large SUV (3 Rows)' },
] as const

export type VehicleType = typeof VEHICLE_TYPES[number]['id']
export type PricingModel = 'flat' | 'variable'

export interface VehicleVariation {
  price: number
  duration: number
  enabled: boolean
}

export interface PricingData {
  pricing_model: PricingModel
  base_price: number
  base_duration: number
  variations: Record<VehicleType, VehicleVariation>
}

interface PricingConfigProps {
  data: PricingData
  onChange: (data: PricingData) => void
}

export default function PricingConfig({ data, onChange }: PricingConfigProps) {
  const [isVariable, setIsVariable] = useState(data.pricing_model === 'variable')

  // When switching modes, handle data migration
  useEffect(() => {
    if (isVariable && data.pricing_model === 'flat') {
      // Switching from flat to variable: auto-fill variations with base values
      const baseDuration = data.base_duration || 120 // in minutes
      const newVariations: Record<VehicleType, VehicleVariation> = {
        coupe: {
          price: data.base_price || 0,
          duration: baseDuration,
          enabled: true,
        },
        sedan: {
          price: data.base_price || 0,
          duration: baseDuration,
          enabled: true,
        },
        suv: {
          price: Math.round((data.base_price || 0) * 1.15), // ~15% more
          duration: baseDuration + 30, // 30 min more (0.5 hours)
          enabled: true,
        },
        truck: {
          price: Math.round((data.base_price || 0) * 1.3), // ~30% more
          duration: baseDuration + 60, // 60 min more (1 hour)
          enabled: true,
        },
      }
      onChange({
        ...data,
        pricing_model: 'variable',
        variations: newVariations,
      })
    } else if (!isVariable && data.pricing_model === 'variable') {
      // Switching from variable to flat: keep base_price and base_duration
      onChange({
        ...data,
        pricing_model: 'flat',
      })
    }
  }, [isVariable])

  // Update pricing_model when toggle changes
  const handleModeChange = (newMode: boolean) => {
    setIsVariable(newMode)
  }

  // Helper to update a specific vehicle row
  const updateTier = (typeId: VehicleType, field: 'price' | 'duration', value: string | number) => {
    // For duration, value is already in minutes (converted from hours in the onChange handler)
    // For price, value is a string that needs to be parsed
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    const currentVariations = data.variations || {}
    const currentTier = currentVariations[typeId] || {
      price: data.base_price || 0,
      duration: data.base_duration || 120,
      enabled: true,
    }

    const newVariations = {
      ...currentVariations,
      [typeId]: {
        ...currentTier,
        [field]: numValue,
        enabled: true,
      },
    }

    onChange({
      ...data,
      variations: newVariations,
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Pricing & Duration</h3>

      {/* Mode Toggle */}
      <div className="flex items-center gap-4 mb-6 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
        <button
          type="button"
          onClick={() => handleModeChange(false)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            !isVariable
              ? 'bg-white dark:bg-zinc-700 shadow text-violet-600 dark:text-violet-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Flat Rate (Simple)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange(true)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            isVariable
              ? 'bg-white dark:bg-zinc-700 shadow text-violet-600 dark:text-violet-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Variable by Size
        </button>
      </div>

      {/* Simple Mode */}
      {!isVariable && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="base_price" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Price
            </Label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3 text-zinc-400" />
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-8"
                placeholder="0.00"
                value={data.base_price || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    base_price: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="base_duration" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Duration (hours)
            </Label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-3 text-zinc-400" />
              <Input
                id="base_duration"
                type="number"
                step="0.5"
                min="0"
                className="w-full pl-8"
                placeholder="2.0"
                inputMode="decimal"
                value={data.base_duration ? (data.base_duration / 60).toFixed(1) : ''}
                onChange={(e) => {
                  const value = e.target.value.trim()
                  if (value === '') {
                    // Allow clearing while typing - keep existing value, will validate on blur
                    // Don't update if field is empty to avoid TypeScript errors
                    return
                  }
                  const hours = parseFloat(value)
                  if (!isNaN(hours) && hours > 0) {
                    // Convert hours to minutes for storage (round to nearest minute)
                    const minutes = Math.max(1, Math.round(hours * 60)) // Ensure at least 1 minute
                    onChange({
                      ...data,
                      base_duration: minutes,
                    })
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.trim()
                  if (value === '') {
                    // If empty on blur, set to minimum default (1 hour)
                    onChange({
                      ...data,
                      base_duration: 60, // Default to 1 hour minimum
                    })
                    return
                  }
                  const hours = parseFloat(value)
                  if (isNaN(hours) || hours <= 0) {
                    // Invalid input, set to minimum default
                    onChange({
                      ...data,
                      base_duration: 60, // Default to 1 hour minimum
                    })
                    return
                  }
                  // Format to 1 decimal place on blur (e.g., 2.0, 2.5)
                  const formatted = hours.toFixed(1)
                  const minutes = Math.max(1, Math.round(parseFloat(formatted) * 60)) // Ensure at least 1 minute
                  onChange({
                    ...data,
                    base_duration: minutes,
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Variable Mode (The Matrix) */}
      {isVariable && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="p-3 font-medium">Vehicle Size</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">Duration (Hours)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {VEHICLE_TYPES.map((type) => {
                const variation = data.variations?.[type.id] || {
                  price: data.base_price || 0,
                  duration: data.base_duration || 120,
                  enabled: true,
                }
                return (
                  <tr key={type.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-3 font-medium text-zinc-700 dark:text-zinc-300">{type.label}</td>

                    {/* Price Input */}
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-zinc-400 text-xs">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 pl-5 pr-2 py-1 text-right"
                          placeholder="150"
                          value={variation.price || ''}
                          onChange={(e) => updateTier(type.id, 'price', e.target.value)}
                        />
                      </div>
                    </td>

                    {/* Duration Input */}
                    <td className="p-3">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-20 p-1 pr-8 text-right"
                          placeholder="2.0"
                          inputMode="decimal"
                          value={variation.duration ? (variation.duration / 60).toFixed(1) : ''}
                          onChange={(e) => {
                            const hours = parseFloat(e.target.value) || 0
                            // Convert hours to minutes for storage (round to nearest minute)
                            const minutes = Math.round(hours * 60)
                            updateTier(type.id, 'duration', minutes)
                          }}
                          onBlur={(e) => {
                            // Format to 1 decimal place on blur (e.g., 2.0, 2.5)
                            const hours = parseFloat(e.target.value) || 0
                            const formatted = hours.toFixed(1)
                            if (e.target.value !== formatted) {
                              const minutes = Math.round(parseFloat(formatted) * 60)
                              updateTier(type.id, 'duration', minutes)
                            }
                          }}
                        />
                        <span className="absolute right-2 top-1.5 text-zinc-400 text-xs">hrs</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2 border-t border-amber-200 dark:border-amber-800">
            <span>💡</span>
            <p>
              <strong>Tip:</strong> Larger vehicles usually take 30-60 mins longer. Be sure to increase duration so
              your calendar doesn't get double-booked.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
