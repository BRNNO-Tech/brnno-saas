'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Car, Truck, Bus, Check, Loader2 } from 'lucide-react'

// Common car makes for auto detailing (curated list)
const COMMON_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda',
  'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Polestar', 'Porsche',
  'Ram', 'Rivian', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
].map((name, index) => ({ Make_ID: index, Make_Name: name }))

const VEHICLE_TYPES = [
  { id: 'coupe', label: 'Coupe', icon: Car, mapToSize: 'coupe' },
  { id: 'sedan', label: 'Sedan', icon: Car, mapToSize: 'sedan' },
  { id: 'crossover', label: 'Crossover', icon: Bus, mapToSize: 'suv' },
  { id: 'suv', label: 'SUV', icon: Bus, mapToSize: 'suv' },
  { id: 'truck', label: 'Truck', icon: Truck, mapToSize: 'truck' },
  { id: 'van', label: 'Van', icon: Truck, mapToSize: 'truck' },
]

const COLORS = [
  { id: 'white', hex: '#ffffff', border: 'border-gray-200' },
  { id: 'silver', hex: '#C0C0C0', border: 'border-transparent' },
  { id: 'black', hex: '#000000', border: 'border-transparent' },
  { id: 'gray', hex: '#808080', border: 'border-transparent' },
  { id: 'red', hex: '#DC2626', border: 'border-transparent' },
  { id: 'blue', hex: '#2563EB', border: 'border-transparent' },
  { id: 'brown', hex: '#78350F', border: 'border-transparent' },
  { id: 'green', hex: '#059669', border: 'border-transparent' },
  { id: 'yellow', hex: '#EAB308', border: 'border-transparent' },
  { id: 'orange', hex: '#EA580C', border: 'border-transparent' },
  { id: 'purple', hex: '#9333EA', border: 'border-transparent' },
]

interface VehicleSelectorProps {
  onSelect: (vehicle: {
    type: string | null
    color: string | null
    year: string
    make: string
    model: string
    size?: string
  }) => void
  initialValue?: {
    asset_size?: string
    asset_color?: string
    asset_year?: string
    asset_make?: string
    asset_model?: string
  }
}

interface Make {
  Make_ID: number
  Make_Name: string
}

interface Model {
  Model_ID: number
  Model_Name: string
}

export default function VehicleSelector({ onSelect, initialValue }: VehicleSelectorProps) {
  const [vehicle, setVehicle] = useState({
    type: initialValue?.asset_size || null,
    color: initialValue?.asset_color || null,
    year: initialValue?.asset_year || '',
    make: initialValue?.asset_make || '',
    model: initialValue?.asset_model || '',
  })

  const [makes] = useState<Make[]>(COMMON_MAKES) // Use curated list instead of API
  const [models, setModels] = useState<Model[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Generate years (current year + 1 down to 1990)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i)

  // Fetch models when make is selected
  useEffect(() => {
    async function fetchModels() {
      if (!vehicle.make) {
        setModels([])
        return
      }

      setLoadingModels(true)
      try {
        // URL encode the make name to handle spaces and special characters
        const encodedMake = encodeURIComponent(vehicle.make)
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodedMake}?format=json`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.Results && Array.isArray(data.Results)) {
          // Filter out invalid entries, remove duplicates, and sort models alphabetically
          const validModels = data.Results.filter((m: Model) => m?.Model_Name && m.Model_Name.trim() !== '')
          const uniqueModels = Array.from(
            new Map(validModels.map((m: Model) => [m.Model_Name, m])).values()
          ) as Model[]
          
          const sortedModels = uniqueModels.sort((a: Model, b: Model) => 
            (a.Model_Name || '').localeCompare(b.Model_Name || '')
          )
          setModels(sortedModels)
        } else {
          setModels([])
        }
      } catch (error) {
        console.error('Error fetching models:', error)
        setModels([])
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, [vehicle.make])

  // Call onSelect when vehicle state changes
  // We use a ref to track if we've initialized to avoid unnecessary calls
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Skip if this is the first render and we have no initial values
    if (!hasInitialized.current) {
      hasInitialized.current = true
      // Only call on mount if we have initial values to sync
      if (initialValue?.asset_size || initialValue?.asset_color || initialValue?.asset_year || initialValue?.asset_make || initialValue?.asset_model) {
        const vehicleData = {
          type: vehicle.type,
          color: vehicle.color,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          size: vehicle.type ? VEHICLE_TYPES.find(v => v.id === vehicle.type)?.mapToSize : undefined,
        }
        onSelect(vehicleData)
      }
      return
    }

    // For subsequent changes, always call onSelect
    const vehicleData = {
      type: vehicle.type,
      color: vehicle.color,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      size: vehicle.type ? VEHICLE_TYPES.find(v => v.id === vehicle.type)?.mapToSize : undefined,
    }
    onSelect(vehicleData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.type, vehicle.color, vehicle.year, vehicle.make, vehicle.model]) // Only depend on vehicle fields, not onSelect

  const handleUpdate = (field: 'type' | 'color' | 'year' | 'make' | 'model', value: string | null) => {
    if (field === 'year') {
      // Reset make and model when year changes
      setVehicle(prev => ({ ...prev, year: value || '', make: '', model: '' }))
    } else if (field === 'make') {
      // Reset model when make changes
      setVehicle(prev => ({ ...prev, make: value || '', model: '' }))
    } else {
      setVehicle(prev => ({ ...prev, [field]: value || '' }))
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
      {/* 1. The "Chick-fil-A" Style Type Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          What vehicle will we be detailing?
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {VEHICLE_TYPES.map((type) => {
            const isSelected = vehicle.type === type.id
            const Icon = type.icon

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleUpdate('type', type.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary/10 border-2 border-primary text-primary'
                    : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon size={28} strokeWidth={1.5} className="mb-2" />
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Year, Make, Model */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Vehicle Details
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Year */}
          <div>
            <label htmlFor="vehicle_year" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Year *
            </label>
            <select
              id="vehicle_year"
              value={vehicle.year}
              onChange={(e) => handleUpdate('year', e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary outline-none transition text-zinc-900 dark:text-zinc-50"
              required
            >
              <option value="">Select year</option>
              {years.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          {/* Make */}
          <div>
            <label htmlFor="vehicle_make" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Make *
            </label>
            <select
              id="vehicle_make"
              value={vehicle.make}
              onChange={(e) => handleUpdate('make', e.target.value)}
              disabled={!vehicle.year}
              className="w-full p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary outline-none transition text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">
                {vehicle.year ? 'Select make' : 'Select year first'}
              </option>
              {makes.map((make) => (
                <option key={make.Make_ID} value={make.Make_Name}>
                  {make.Make_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label htmlFor="vehicle_model" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Model *
            </label>
            <select
              id="vehicle_model"
              value={vehicle.model}
              onChange={(e) => handleUpdate('model', e.target.value)}
              disabled={!vehicle.make || loadingModels}
              className="w-full p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary outline-none transition text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">
                {loadingModels 
                  ? 'Loading models...' 
                  : vehicle.make 
                    ? 'Select model' 
                    : 'Select make first'}
              </option>
              {models.map((model) => (
                <option key={model.Model_ID} value={model.Model_Name}>
                  {model.Model_Name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. The Color Dots */}
      <div>
        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Vehicle Color
        </label>
        <div className="flex flex-wrap gap-4 justify-center">
          {COLORS.map((c) => {
            const isSelected = vehicle.color === c.id

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleUpdate('color', c.id)}
                className={`relative w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 ${c.border} ${
                  isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.id}
              >
                {isSelected && c.id === 'white' && (
                  <Check
                    size={16}
                    className="text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                )}
                {isSelected && c.id !== 'white' && (
                  <Check
                    size={16}
                    className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2">
          {vehicle.color
            ? vehicle.color.charAt(0).toUpperCase() + vehicle.color.slice(1)
            : 'Select a color'}
        </p>
      </div>
    </div>
  )
}
