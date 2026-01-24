import { Service } from '@/types'
import { ServiceAddon } from '@/types'
import { getServicePrice, getServiceDuration } from './service-pricing'

type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'crossover'

/**
 * Maps vehicle type to pricing variation key
 * Handles cases where vehicle selector types don't match pricing keys exactly
 * e.g., 'van' -> 'truck', 'coupe' -> 'coupe', 'crossover' -> 'suv'
 * Exported for use in booking form
 */
export function mapVehicleTypeToPricingKey(vehicleType: string | null | undefined): 'coupe' | 'sedan' | 'suv' | 'truck' | null {
  if (!vehicleType) return null
  
  const normalized = vehicleType.toLowerCase()
  
  // Map vehicle selector types to pricing variation keys
  const mapping: Record<string, 'coupe' | 'sedan' | 'suv' | 'truck'> = {
    'coupe': 'coupe',
    'sedan': 'sedan',
    'suv': 'suv',
    'truck': 'truck',
    'van': 'truck', // Van maps to truck for pricing
    'crossover': 'suv', // Crossover maps to SUV for pricing
  }
  
  return mapping[normalized] || null
}

interface BookingTotals {
  price: number
  duration: number
  breakdown?: {
    base: number
    sizeFee?: number
    conditionFee?: number
    addons: number
  }
}

/**
 * Calculates the final total price and estimated duration using ADDITIVE percentage logic.
 * Formula: Base + (Base × Size%) + (FinalPrice × Condition%) + Addons
 * Note: Condition percentage is calculated on the final price after vehicle size adjustments
 * @param service - The full service object from DB
 * @param vehicleType - ID of selected vehicle (e.g., 'truck')
 * @param selectedAddons - List of full addon objects selected
 * @param condition - Vehicle condition ID (from business's condition config)
 * @param conditionConfig - Business's condition configuration (null if disabled or not configured)
 */
export function calculateTotals(
  service: Service | null,
  vehicleType: VehicleType | null,
  selectedAddons: ServiceAddon[] = [],
  condition: string | null = null,
  conditionConfig: {
    enabled: boolean
    tiers: Array<{
      id: string
      label: string
      description: string
      markup_percent: number
    }>
  } | null = null
): BookingTotals {
  console.log('--- DEBUG PRICING ---')
  
  if (!service) {
    console.error('❌ No service provided')
    return { price: 0, duration: 0 }
  }

  // 1. Start with base values
  const basePrice = Number(service.base_price || service.price || 0)
  const baseDuration = Number(service.base_duration || service.estimated_duration || service.duration_minutes || 60)

  console.log('1. Pricing Model:', service.pricing_model)
  console.log('2. Selected Vehicle ID:', vehicleType)
  console.log('3. Condition:', condition)
  console.log('4. Base Price:', basePrice)
  console.log('5. Base Duration:', baseDuration)

  // 2. Calculate Vehicle Size Markup (if variable pricing)
  let sizeMarkup = 0
  let sizeFee = 0
  let finalPrice = basePrice
  let finalDuration = baseDuration

  if (service.pricing_model === 'variable' && vehicleType) {
    // Map vehicle type to pricing key (handles van -> truck, etc.)
    const pricingKey = mapVehicleTypeToPricingKey(vehicleType)
    const variations = service.variations || {}
    const tier = pricingKey ? variations[pricingKey as keyof typeof variations] : undefined
    
    if (tier && pricingKey && tier.enabled) {
      // For variable pricing, the tier price IS the base price for that vehicle
      // But we need to calculate the markup percentage for display
      const tierPrice = Number(tier.price)
      const tierDuration = Number(tier.duration)
      sizeFee = tierPrice - basePrice
      sizeMarkup = basePrice > 0 ? (sizeFee / basePrice) : 0
      finalPrice = tierPrice
      finalDuration = tierDuration
      console.log(`✅ Vehicle tier: ${pricingKey}, Price: ${tierPrice}, Size Fee: ${sizeFee}`)
    } else {
      console.log('ℹ️ Using base price (no vehicle tier or tier disabled)')
    }
  }

  // 3. Calculate Condition Markup (ADDITIVE - percentage off final price after vehicle size adjustments)
  // Use business's custom condition config if available, otherwise skip
  let conditionFee = 0
  if (condition && conditionConfig?.enabled && conditionConfig.tiers) {
    const tier = conditionConfig.tiers.find(t => t.id === condition)
    if (tier) {
      // Calculate condition fee on final price (after vehicle size adjustments)
      // This ensures larger vehicles pay proportionally more for condition fees
      conditionFee = finalPrice * tier.markup_percent
      finalPrice += conditionFee
      console.log(`✅ Condition: ${tier.label}, Markup: ${(tier.markup_percent * 100).toFixed(0)}%, Fee: $${conditionFee.toFixed(2)}`)
    } else {
      console.log(`⚠️ Condition tier not found: ${condition}`)
    }
  } else {
    if (condition) {
      console.log(`⚠️ Condition config not enabled or missing: enabled=${conditionConfig?.enabled}, tiers=${conditionConfig?.tiers?.length || 0}`)
    }
  }

  // 4. Add Add-ons (flat fees)
  let addonsTotal = 0
  let addonsDuration = 0
  selectedAddons.forEach((addon) => {
    const addonPrice = Number(addon.price || 0)
    const addonDuration = Number(addon.duration_minutes || addon.duration || 0)
    addonsTotal += addonPrice
    addonsDuration += addonDuration
    console.log(`   + Addon: ${addon.name} (+$${addonPrice}, +${addonDuration}m)`)
  })
  finalPrice += addonsTotal
  finalDuration += addonsDuration

  console.log('-> FINAL CALCULATED:', { 
    price: finalPrice, 
    duration: finalDuration,
    breakdown: {
      base: basePrice,
      sizeFee,
      conditionFee,
      addons: addonsTotal
    }
  })
  console.log('--- END DEBUG PRICING ---')

  return {
    price: Math.max(0, finalPrice), // Ensure non-negative
    duration: Math.max(0, finalDuration), // Ensure non-negative
    breakdown: {
      base: basePrice,
      sizeFee: sizeFee !== 0 ? sizeFee : undefined,
      conditionFee: conditionFee !== 0 ? conditionFee : undefined,
      addons: addonsTotal
    }
  }
}

/**
 * Helper to convert minutes to readable string
 * e.g. 150 -> "2h 30m" or "2.5 hours"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m'
  
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format duration in hours with decimal (e.g., 150 -> "2.5 hours")
 */
export function formatDurationHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 hours'
  
  const hours = minutes / 60
  if (hours % 1 === 0) {
    return `${hours.toFixed(0)} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${hours.toFixed(1)} hours`
}
