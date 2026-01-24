/**
 * Normalize phone number to E.164 format for SMS providers
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Must have at least 10 digits
  if (cleaned.length < 10) return null
  
  // If 10 digits (US number without country code), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // If 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // For other international formats, just add +
  if (cleaned.length > 11) {
    return `+${cleaned}`
  }
  
  // Default: assume US and add +1
  return `+1${cleaned}`
}
