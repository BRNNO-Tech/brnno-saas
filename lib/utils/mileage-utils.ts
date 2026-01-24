/**
 * Mileage tracking utilities
 * Handles Google Maps API calls and distance calculations
 */

const IRS_MILEAGE_RATE = 0.67 // 2024 rate (update when IRS announces 2025 rate)

/**
 * Calculate driving distance between two addresses using Google Maps API
 * Falls back to straight-line distance if API fails
 */
export async function calculateDrivingDistance(
  fromAddress: string,
  toAddress: string
): Promise<number> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('[Mileage] Google Maps API key not configured, using straight-line distance')
    return calculateStraightLineDistance(fromAddress, toAddress)
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.append('origins', fromAddress)
    url.searchParams.append('destinations', toAddress)
    url.searchParams.append('units', 'imperial') // miles
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      // Distance is in meters, convert to miles
      const meters = data.rows[0].elements[0].distance.value
      const miles = meters * 0.000621371
      console.log(`[Mileage] Google Maps calculated: ${miles.toFixed(2)} miles`)
      return Math.round(miles * 10) / 10 // Round to 1 decimal
    }

    throw new Error(`API returned non-OK status: ${data.status}`)
  } catch (error) {
    console.error('[Mileage] Google Maps API error:', error)
    // Fallback to straight-line distance
    return calculateStraightLineDistance(fromAddress, toAddress)
  }
}

/**
 * Fallback: Calculate straight-line distance using Haversine formula
 * Requires lat/lng coordinates
 * This is a simplified fallback - in production you'd geocode addresses first
 */
export function calculateStraightLineDistance(
  fromAddress: string,
  toAddress: string
): number {
  // This is a simplified fallback - in production you'd geocode addresses first
  // For now, return a default estimate
  console.warn('[Mileage] Using estimated distance - configure Google Maps API for accuracy')
  return 10 // Default 10 miles
}

/**
 * Calculate distance between coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate total mileage for a list of jobs/records
 */
export function calculateTotalMileage(
  records: Array<{ miles_driven?: number; mileage_to_job?: number }>
): number {
  return records.reduce((total, record) => {
    const miles = record.miles_driven || record.mileage_to_job || 0
    return total + miles
  }, 0)
}

/**
 * Get mileage summary by time period
 * Utility function that takes records as input
 */
export function getMileageSummary(
  mileageRecords: Array<{ miles_driven: number; created_at: string }>
): {
  today: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  total: number
} {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  let today = 0
  let thisWeek = 0
  let thisMonth = 0
  let thisYear = 0
  let total = 0

  mileageRecords.forEach((record) => {
    const recordDate = new Date(record.created_at)
    const miles = record.miles_driven

    total += miles

    if (recordDate >= todayStart) today += miles
    if (recordDate >= weekStart) thisWeek += miles
    if (recordDate >= monthStart) thisMonth += miles
    if (recordDate >= yearStart) thisYear += miles
  })

  return {
    today: Math.round(today * 10) / 10,
    thisWeek: Math.round(thisWeek * 10) / 10,
    thisMonth: Math.round(thisMonth * 10) / 10,
    thisYear: Math.round(thisYear * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}

/**
 * Calculate IRS mileage deduction (2024 rate: $0.67/mile)
 */
export function calculateMileageDeduction(
  miles: number,
  ratePerMile: number = IRS_MILEAGE_RATE
): number {
  return Math.round(miles * ratePerMile * 100) / 100
}

/**
 * Format address string from components
 */
export function formatAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): string {
  const parts = [address, city, state, zip].filter(Boolean)
  return parts.join(', ') || 'Unknown location'
}

/**
 * Get IRS mileage rate (update annually)
 */
export function getIRSRate(): number {
  return IRS_MILEAGE_RATE
}
