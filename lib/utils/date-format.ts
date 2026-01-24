/**
 * Formats a date string from the database (UTC) to a readable local time string
 * This ensures dates are displayed correctly regardless of server/client timezone
 * Uses consistent formatting that matches calendar display
 */
export function formatJobDate(date: string | Date | null): string {
  if (!date) return 'Not scheduled'
  
  try {
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('Invalid date:', date)
      return 'Invalid date'
    }
    
    // Get local date components for consistent comparison
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Format time consistently
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    // Use relative dates for better UX
    if (localDate.getTime() === today.getTime()) {
      return `Today · ${timeStr}`
    } else if (localDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow · ${timeStr}`
    } else {
      // Format date and time separately for consistency
      const dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
      return `${dateStr} · ${timeStr}`
    }
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'Invalid date'
  }
}

/**
 * Formats just the time portion of a date
 */
export function formatJobTime(date: string | Date | null): string {
  if (!date) return ''
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time:', error, date)
    return ''
  }
}

/**
 * Formats date with relative time (Today, Tomorrow, etc.)
 */
export function formatJobDateRelative(date: string | Date | null): string {
  if (!date) return 'Not scheduled'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const jobDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    
    const diffDays = Math.floor((jobDate.getTime() - today.getTime()) / 86400000)
    
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    
    if (diffDays === 0) return `Today · ${timeStr}`
    if (diffDays === 1) return `Tomorrow · ${timeStr}`
    if (diffDays < 7) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      return `${dayName} · ${timeStr}`
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch (error) {
    console.error('Error formatting relative date:', error, date)
    return 'Invalid date'
  }
}
