import type { VehicleType } from '@/components/services/pricing-config'

export interface ServicePricingData {
  pricing_model?: 'flat' | 'variable'
  base_price: number
  base_duration?: number
  variations?: Record<VehicleType, { price: number; duration: number; enabled: boolean }>
  price?: number // Legacy field
  estimated_duration?: number // Legacy field
}

/**
 * Get the price for a service based on vehicle type
 * Returns the base_price for flat pricing, or the variation price for variable pricing
 */
export function getServicePrice(
  service: ServicePricingData,
  vehicleType?: VehicleType
): number {
  // If flat pricing or no vehicle type specified, return base price
  if (service.pricing_model !== 'variable' || !vehicleType) {
    return service.base_price || service.price || 0
  }

  // Get variation for vehicle type
  const variations: Record<string, { price: number; duration: number; enabled: boolean }> = service.variations || {}
  const variation = variations[vehicleType]
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[getServicePrice] Looking for vehicleType:', vehicleType)
    console.log('[getServicePrice] Available variations keys:', Object.keys(variations))
    console.log('[getServicePrice] Variation found:', variation)
  }
  
  if (variation && variation.enabled) {
    return variation.price
  }

  // Fallback to base price if variation not found or disabled
  if (process.env.NODE_ENV === 'development' && !variation) {
    console.warn(`[getServicePrice] No variation found for '${vehicleType}'. Using base price.`)
  }
  
  return service.base_price || service.price || 0
}

/**
 * Get the duration for a service based on vehicle type
 * Returns the base_duration for flat pricing, or the variation duration for variable pricing
 */
export function getServiceDuration(
  service: ServicePricingData,
  vehicleType?: VehicleType
): number {
  // If flat pricing or no vehicle type specified, return base duration
  if (service.pricing_model !== 'variable' || !vehicleType) {
    return service.base_duration || service.estimated_duration || 120
  }

  // Get variation for vehicle type
  const variations: Record<string, { price: number; duration: number; enabled: boolean }> = service.variations || {}
  const variation = variations[vehicleType]
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[getServiceDuration] Looking for vehicleType:', vehicleType)
    console.log('[getServiceDuration] Available variations keys:', Object.keys(variations))
    console.log('[getServiceDuration] Variation found:', variation)
  }
  
  if (variation && variation.enabled) {
    return variation.duration
  }

  // Fallback to base duration if variation not found or disabled
  if (process.env.NODE_ENV === 'development' && !variation) {
    console.warn(`[getServiceDuration] No variation found for '${vehicleType}'. Using base duration.`)
  }
  
  return service.base_duration || service.estimated_duration || 120
}

/**
 * Get the minimum price from variations (for "Starting at" display)
 */
export function getStartingPrice(service: ServicePricingData): number {
  if (service.pricing_model !== 'variable' || !service.variations) {
    return service.base_price || service.price || 0
  }

  // Find the minimum enabled price
  const enabledPrices = Object.values(service.variations)
    .filter((v) => v.enabled)
    .map((v) => v.price)

  if (enabledPrices.length === 0) {
    return service.base_price || service.price || 0
  }

  return Math.min(...enabledPrices)
}

/**
 * Check if service uses variable pricing
 */
export function isVariablePricing(service: ServicePricingData): boolean {
  return service.pricing_model === 'variable' && !!service.variations
}
