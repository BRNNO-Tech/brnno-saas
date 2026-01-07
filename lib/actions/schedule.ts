'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getBusinessId } from './utils'
import { revalidatePath } from 'next/cache'

/**
 * Expands recurring time blocks into individual instances for a date range
 */
function expandRecurringBlocks(blocks: any[], startDate: Date, endDate: Date): any[] {
  const expanded: any[] = []

  for (const block of blocks) {
    if (!block.is_recurring || !block.recurrence_pattern) {
      // Non-recurring block - add as-is if in range
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)
      if (blockStart <= endDate && blockEnd >= startDate) {
        expanded.push(block)
      }
      continue
    }

    // Recurring block - expand it
    const baseStart = new Date(block.start_time)
    const baseEnd = new Date(block.end_time)
    const duration = baseEnd.getTime() - baseStart.getTime()
    
    // Extract time components from base start
    const baseHour = baseStart.getHours()
    const baseMinute = baseStart.getMinutes()
    const baseSecond = baseStart.getSeconds()
    const baseMillisecond = baseStart.getMilliseconds()

    let currentDate = new Date(baseStart)
    let occurrenceCount = 0
    const maxOccurrences = block.recurrence_count || 999
    const endDateLimit = block.recurrence_end_date ? new Date(block.recurrence_end_date) : endDate
    // Set end date limit to end of day if it's a date-only value
    if (block.recurrence_end_date && !block.recurrence_end_date.includes('T')) {
      endDateLimit.setHours(23, 59, 59, 999)
    }

    // Start from the first occurrence that could overlap with the date range
    // For weekly/monthly/yearly, we might need to go back to find the first occurrence
    if (block.recurrence_pattern === 'weekly' || block.recurrence_pattern === 'monthly' || block.recurrence_pattern === 'yearly') {
      while (currentDate > startDate && currentDate <= endDateLimit && occurrenceCount < maxOccurrences) {
        const prevDate = new Date(currentDate)
        switch (block.recurrence_pattern) {
          case 'weekly':
            prevDate.setDate(prevDate.getDate() - 7)
            break
          case 'monthly':
            prevDate.setMonth(prevDate.getMonth() - 1)
            break
          case 'yearly':
            prevDate.setFullYear(prevDate.getFullYear() - 1)
            break
        }
        if (prevDate < baseStart) break
        currentDate = prevDate
      }
    }

    while (currentDate <= endDate && currentDate <= endDateLimit && occurrenceCount < maxOccurrences) {
      // Preserve time components
      currentDate.setHours(baseHour, baseMinute, baseSecond, baseMillisecond)
      
      const instanceStart = new Date(currentDate)
      const instanceEnd = new Date(instanceStart.getTime() + duration)
      
      // Only add if this instance overlaps with the requested date range
      if (instanceStart <= endDate && instanceEnd >= startDate) {
        expanded.push({
          ...block,
          id: `${block.id}_${occurrenceCount}`, // Unique ID for each instance
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring_instance: true,
          original_id: block.id,
        })
      }

      // Move to next occurrence
      occurrenceCount++
      switch (block.recurrence_pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
      }
    }
  }

  return expanded
}

/**
 * Gets all time blocks (personal time, holidays) for the business
 * Expands recurring blocks into individual instances
 */
export async function getTimeBlocks(startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Fetch all blocks (including recurring ones)
  let query = supabase
    .from('time_blocks')
    .select('*')
    .eq('business_id', businessId)
    .order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching time blocks:', error)
    throw new Error(`Failed to fetch time blocks: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Expand recurring blocks if date range is provided
  if (startDate && endDate) {
    return expandRecurringBlocks(data, new Date(startDate), new Date(endDate))
  }

  return data
}

/**
 * Creates a new time block (personal time, holiday, etc.)
 */
export async function createTimeBlock(data: {
  title: string
  start_time: string
  end_time: string
  type: 'personal' | 'holiday' | 'unavailable'
  description?: string | null
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_end_date?: string | null
  recurrence_count?: number | null
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  console.log('[createTimeBlock] Creating time block with data:', {
    business_id: businessId,
    ...data,
  })

  const { data: timeBlock, error } = await supabase
    .from('time_blocks')
    .insert({
      business_id: businessId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    console.error('[createTimeBlock] Error creating time block:', error)
    throw new Error(`Failed to create time block: ${error.message}`)
  }

  console.log('[createTimeBlock] Time block created successfully:', timeBlock)

  revalidatePath('/dashboard/schedule')
  return timeBlock
}

/**
 * Deletes a time block
 */
export async function deleteTimeBlock(id: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { error } = await supabase
    .from('time_blocks')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)

  if (error) {
    console.error('Error deleting time block:', error)
    throw new Error(`Failed to delete time block: ${error.message}`)
  }

  revalidatePath('/dashboard/schedule')
}

/**
 * Gets jobs for the schedule (scheduled and in_progress)
 */
export async function getScheduledJobs(startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  let query = supabase
    .from('jobs')
    .select(`
      *,
      client:clients(name, phone, email)
    `)
    .eq('business_id', businessId)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true })

  if (startDate && endDate) {
    query = query
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching scheduled jobs:', error)
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return data || []
}

/**
 * Gets business hours from business settings
 */
export async function getBusinessHours() {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: business, error } = await supabase
    .from('businesses')
    .select('business_hours')
    .eq('id', businessId)
    .single()

  if (error) {
    console.error('Error fetching business hours:', error)
    return null
  }

  return business?.business_hours || null
}

/**
 * Updates business hours
 */
export async function updateBusinessHours(hours: {
  monday?: { open: string; close: string; closed?: boolean } | null
  tuesday?: { open: string; close: string; closed?: boolean } | null
  wednesday?: { open: string; close: string; closed?: boolean } | null
  thursday?: { open: string; close: string; closed?: boolean } | null
  friday?: { open: string; close: string; closed?: boolean } | null
  saturday?: { open: string; close: string; closed?: boolean } | null
  sunday?: { open: string; close: string; closed?: boolean } | null
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { error } = await supabase
    .from('businesses')
    .update({ business_hours: hours })
    .eq('id', businessId)

  if (error) {
    console.error('Error updating business hours:', error)
    throw new Error(`Failed to update business hours: ${error.message}`)
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/settings')
}

/**
 * Updates a job's scheduled date (for drag and drop)
 */
export async function updateJobDate(jobId: string, newDate: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Verify job belongs to business
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (fetchError || !job) {
    throw new Error('Job not found or access denied')
  }

  const { error } = await supabase
    .from('jobs')
    .update({ scheduled_date: newDate })
    .eq('id', jobId)

  if (error) {
    console.error('Error updating job date:', error)
    throw new Error(`Failed to update job date: ${error.message}`)
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/jobs')
}

/**
 * Checks if a time slot is available for booking
 * Returns available time slots for a given date
 * This function can be called without authentication (for customer booking)
 */
export async function getAvailableTimeSlots(
  businessId: string,
  date: string,
  durationMinutes: number = 60
): Promise<string[]> {
  // Use service role client to bypass RLS for public booking access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration for public booking access')
    throw new Error('Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get business hours
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('business_hours')
    .eq('id', businessId)
    .single()

  if (businessError) {
    console.error('[getAvailableTimeSlots] Error fetching business:', businessError)
    // Continue with defaults if business not found
  }

  // Default business hours if not set (9 AM - 5 PM, Mon-Fri)
  const defaultHours = {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { closed: true },
    sunday: { closed: true },
  }

  const businessHours = business?.business_hours || defaultHours
  console.log(`[getAvailableTimeSlots] Business hours for ${businessId}:`, JSON.stringify(businessHours))
  console.log(`[getAvailableTimeSlots] Requested date: ${date}`)

  // Parse date correctly (YYYY-MM-DD format)
  // Create date in local timezone to avoid UTC issues
  const dateParts = date.split('-')
  if (dateParts.length !== 3) {
    console.error(`[getAvailableTimeSlots] Invalid date format: ${date}`)
    return []
  }
  
  const [year, month, day] = dateParts.map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error(`[getAvailableTimeSlots] Invalid date values: ${date}`)
    return []
  }
  
  const dateObj = new Date(year, month - 1, day) // month is 0-indexed
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayIndex = dateObj.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayOfWeek = dayNames[dayIndex] as keyof typeof businessHours
  const dayHours = businessHours[dayOfWeek]

  console.log(`[getAvailableTimeSlots] Day of week: ${String(dayOfWeek)} (index: ${dayIndex})`)
  console.log(`[getAvailableTimeSlots] Day hours:`, dayHours)

  if (!dayHours || dayHours.closed) {
    console.log(`[getAvailableTimeSlots] Day ${String(dayOfWeek)} is closed for business ${businessId}`)
    return [] // Day is closed
  }

  // Validate that open and close times exist
  if (!dayHours.open || !dayHours.close) {
    console.error(`[getAvailableTimeSlots] Missing open/close times for ${String(dayOfWeek)}:`, dayHours)
    // Use defaults if missing
    dayHours.open = '09:00'
    dayHours.close = '17:00'
  }

  // Get time blocks for the date (use local date object)
  const startOfDay = new Date(dateObj)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(dateObj)
  endOfDay.setHours(23, 59, 59, 999)

  // Fetch time blocks that might overlap with this day
  // We'll filter them properly after expanding recurring blocks
  const { data: timeBlocks, error: timeBlocksError } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('business_id', businessId)

  if (timeBlocksError) {
    console.error('[getAvailableTimeSlots] Error fetching time blocks:', timeBlocksError)
  } else {
    console.log(`[getAvailableTimeSlots] Found ${timeBlocks?.length || 0} time blocks for business ${businessId}`)
  }

  // Get existing jobs for the date
  const { data: jobs } = await supabase
    .from('jobs')
    .select('scheduled_date, estimated_duration')
    .eq('business_id', businessId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', startOfDay.toISOString())
    .lte('scheduled_date', endOfDay.toISOString())

  // Expand recurring time blocks and filter to only those that overlap with the target day
  const allTimeBlocks = timeBlocks
    ? expandRecurringBlocks(timeBlocks, startOfDay, endOfDay).filter(block => {
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)
      // Block overlaps if it starts before day ends and ends after day starts
      return blockStart <= endOfDay && blockEnd >= startOfDay
    })
    : []

  // Parse business hours
  const [openHour, openMinute] = dayHours.open.split(':').map(Number)
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)

  const openTime = new Date(dateObj)
  openTime.setHours(openHour, openMinute, 0, 0)
  const closeTime = new Date(dateObj)
  closeTime.setHours(closeHour, closeMinute, 0, 0)

  console.log(`[getAvailableTimeSlots] Date: ${date}, Day: ${String(dayOfWeek)}, Hours: ${dayHours.open} - ${dayHours.close}, OpenTime: ${openTime.toISOString()}, CloseTime: ${closeTime.toISOString()}`)

  // Generate available time slots (every 30 minutes)
  const availableSlots: string[] = []
  const slotInterval = 30 // minutes
  let currentTime = new Date(openTime)

  while (currentTime < closeTime) {
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000)

    // Check if slot fits within business hours
    if (slotEnd > closeTime) {
      break
    }

    // Check if slot conflicts with time blocks
    const conflictsWithBlock = allTimeBlocks.some(block => {
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)
      const conflicts = (
        (currentTime >= blockStart && currentTime < blockEnd) ||
        (slotEnd > blockStart && slotEnd <= blockEnd) ||
        (currentTime <= blockStart && slotEnd >= blockEnd)
      )
      if (conflicts) {
        console.log(`[getAvailableTimeSlots] Slot ${currentTime.toTimeString().slice(0, 5)} conflicts with block: ${block.title} (${blockStart.toISOString()} - ${blockEnd.toISOString()})`)
      }
      return conflicts
    })

    // Check if slot conflicts with existing jobs
    // Only check jobs that have a valid scheduled_date with a time component
    const conflictsWithJob = jobs?.some(job => {
      if (!job.scheduled_date) return false
      const jobStart = new Date(job.scheduled_date)

      // Skip jobs that don't have a time set (just a date)
      // If the time is midnight (00:00:00), it might be a date-only entry
      const hasTime = jobStart.getHours() !== 0 || jobStart.getMinutes() !== 0 || jobStart.getSeconds() !== 0
      if (!hasTime) return false

      const jobDuration = (job.estimated_duration || 60) * 60 * 1000
      const jobEnd = new Date(jobStart.getTime() + jobDuration)
      return (
        (currentTime >= jobStart && currentTime < jobEnd) ||
        (slotEnd > jobStart && slotEnd <= jobEnd) ||
        (currentTime <= jobStart && slotEnd >= jobEnd)
      )
    })

    if (!conflictsWithBlock && !conflictsWithJob) {
      const timeString = currentTime.toTimeString().slice(0, 5) // HH:MM format
      availableSlots.push(timeString)
    }

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + slotInterval * 60 * 1000)
  }

  console.log(`[getAvailableTimeSlots] Found ${availableSlots.length} available slots for ${date}:`, availableSlots.slice(0, 5), availableSlots.length > 5 ? '...' : '')
  
  return availableSlots
}

/**
 * Checks if a specific date/time is available for booking
 * Uses local date/time (not UTC) to match how slots are generated
 */
export async function checkTimeSlotAvailability(
  businessId: string,
  date: string, // "2024-01-15"
  time: string, // "14:00"
  durationMinutes: number = 60
): Promise<boolean> {
  console.log(`[checkTimeSlotAvailability] Checking availability for date: ${date}, time: ${time}, duration: ${durationMinutes}`)
  
  // Get available slots for this date (uses local timezone)
  const availableSlots = await getAvailableTimeSlots(businessId, date, durationMinutes)
  
  console.log(`[checkTimeSlotAvailability] Available slots:`, availableSlots)
  console.log(`[checkTimeSlotAvailability] Requested time: ${time}`)

  // Check if requested time exactly matches any available slot
  const exactMatch = availableSlots.includes(time)
  
  if (exactMatch) {
    console.log(`[checkTimeSlotAvailability] Exact match found: ${time}`)
    return true
  }

  // Also check if within 30 minutes tolerance
  const matches = availableSlots.some(slot => {
    // Parse times as HH:MM and compare
    const [slotHour, slotMin] = slot.split(':').map(Number)
    const [reqHour, reqMin] = time.split(':').map(Number)
    
    const slotMinutes = slotHour * 60 + slotMin
    const reqMinutes = reqHour * 60 + reqMin
    const diff = Math.abs(slotMinutes - reqMinutes)
    
    if (diff <= 30) {
      console.log(`[checkTimeSlotAvailability] Within tolerance: ${slot} (diff: ${diff} minutes)`)
      return true
    }
    
    return false
  })
  
  console.log(`[checkTimeSlotAvailability] Final result: ${matches ? 'AVAILABLE' : 'NOT AVAILABLE'}`)
  
  return matches
}
