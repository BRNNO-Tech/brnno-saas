'use server'

/**
 * Mileage tracking server actions
 */

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from '@/lib/actions/utils'
import { calculateDrivingDistance, formatAddress, calculateMileageDeduction, getIRSRate } from '@/lib/utils/mileage-utils'
import { revalidatePath } from 'next/cache'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockMileageSummary } from '@/lib/demo/mock-data'
import type { JobMileage, MileageSummary, MileageRecordWithJob } from '@/types/mileage'

/**
 * Auto-log mileage when a job is completed
 * Finds the previous completed job and calculates distance
 */
export async function autoLogMileage(jobId: string): Promise<JobMileage | null> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Check if business has mileage tracker subscription add-on
  const { hasSubscriptionAddon } = await import('@/lib/actions/subscription-addons')
  const hasMileageAddon = await hasSubscriptionAddon('mileage_tracker', businessId)

  if (!hasMileageAddon) {
    console.log('[Mileage] Business does not have mileage tracker subscription add-on, skipping auto-log')
    return null
  }

  // Get the current job
  const { data: currentJob, error: jobError } = await supabase
    .from('jobs')
    .select('id, address, city, state, zip, completed_at')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (jobError || !currentJob) {
    console.error('[Mileage] Error fetching current job:', jobError)
    return null
  }

  // Check if mileage already logged for this job
  const { data: existing } = await supabase
    .from('job_mileage')
    .select('id')
    .eq('job_id', jobId)
    .single()

  if (existing) {
    console.log('[Mileage] Mileage already logged for this job')
    return null
  }

  // Get the most recent completed job (previous job)
  // Use completed_at to identify completed jobs (more reliable than status column)
  const { data: previousJob, error: previousJobError } = await supabase
    .from('jobs')
    .select('id, address, city, state, zip, completed_at')
    .eq('business_id', businessId)
    .not('completed_at', 'is', null)
    .neq('id', jobId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  // If error is about missing column or no results, handle gracefully
  if (previousJobError) {
    // If it's a "no rows" error (PGRST116), that's fine - just means no previous job
    if (previousJobError.code === 'PGRST116') {
      console.log('[Mileage] No previous completed job found, skipping auto-log')
      return null
    }
    // For other errors, log and skip
    console.error('[Mileage] Error fetching previous job:', previousJobError)
    return null
  }

  // If no previous job, can't calculate mileage
  if (!previousJob || !previousJob.completed_at) {
    console.log('[Mileage] No previous completed job found, skipping auto-log')
    return null
  }

  // Build addresses
  const fromAddress = formatAddress(
    previousJob.address,
    previousJob.city,
    previousJob.state,
    previousJob.zip
  )
  const toAddress = formatAddress(
    currentJob.address,
    currentJob.city,
    currentJob.state,
    currentJob.zip
  )

  if (!fromAddress || !toAddress || fromAddress === 'Unknown location' || toAddress === 'Unknown location') {
    console.log('[Mileage] Missing address information, skipping auto-log')
    return null
  }

  // Calculate distance
  let miles: number
  try {
    miles = await calculateDrivingDistance(fromAddress, toAddress)
  } catch (error) {
    console.error('[Mileage] Error calculating distance:', error)
    return null
  }

  // Skip very short distances (likely same location)
  if (miles < 0.5) {
    console.log('[Mileage] Distance too short (< 0.5 miles), skipping')
    return null
  }

  // Create mileage record
  const { data: mileageRecord, error: insertError } = await supabase
    .from('job_mileage')
    .insert({
      business_id: businessId,
      job_id: jobId,
      previous_job_id: previousJob.id,
      from_address: previousJob.address,
      from_city: previousJob.city,
      from_state: previousJob.state,
      from_zip: previousJob.zip,
      to_address: currentJob.address,
      to_city: currentJob.city,
      to_state: currentJob.state,
      to_zip: currentJob.zip,
      miles_driven: miles,
      is_manual_override: false,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[Mileage] Error creating mileage record:', insertError)
    return null
  }

  console.log(`[Mileage] Auto-logged ${miles} miles for job ${jobId}`)
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/mileage')

  return mileageRecord
}

/**
 * Manually log mileage
 */
export async function logMileage(
  jobId: string,
  miles: number,
  fromAddress?: string,
  toAddress?: string,
  notes?: string
): Promise<JobMileage> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get job to get address info
  const { data: job } = await supabase
    .from('jobs')
    .select('address, city, state, zip')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (!job) {
    throw new Error('Job not found')
  }

  const toAddr = toAddress || formatAddress(job.address, job.city, job.state, job.zip)

  const { data: mileageRecord, error } = await supabase
    .from('job_mileage')
    .insert({
      business_id: businessId,
      job_id: jobId,
      from_address: fromAddress || null,
      to_address: toAddr,
      to_city: job.city,
      to_state: job.state,
      to_zip: job.zip,
      miles_driven: miles,
      is_manual_override: true,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/mileage')

  return mileageRecord
}

/**
 * Update existing mileage record
 */
export async function updateMileage(
  mileageId: string,
  miles: number,
  notes?: string
): Promise<JobMileage> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: mileageRecord, error } = await supabase
    .from('job_mileage')
    .update({
      miles_driven: miles,
      is_manual_override: true,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mileageId)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/mileage')

  return mileageRecord
}

/**
 * Delete mileage record
 */
export async function deleteMileage(mileageId: string): Promise<void> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { error } = await supabase
    .from('job_mileage')
    .delete()
    .eq('id', mileageId)
    .eq('business_id', businessId)

  if (error) throw error

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/mileage')
}

/**
 * Get mileage records with optional filters
 */
export async function getMileageRecords(
  startDate?: string,
  endDate?: string
): Promise<MileageRecordWithJob[]> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  let query = supabase
    .from('job_mileage')
    .select(`
      *,
      job:jobs(id, title, scheduled_date, completed_at)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  // If table doesn't exist, return empty array
  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === 'PGRST116') {
      return []
    }
    throw error
  }
  return (data || []) as MileageRecordWithJob[]
}

/**
 * Get mileage summary for dashboard
 */
export async function getMileageSummary(): Promise<MileageSummary> {
  if (await isDemoMode()) {
    return getMockMileageSummary()
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  const irsRate = getIRSRate()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  // Get all mileage records - handle case where table doesn't exist
  const { data: allRecords, error } = await supabase
    .from('job_mileage')
    .select('miles_driven, created_at')
    .eq('business_id', businessId)

  // If table doesn't exist or error, return empty summary
  if (error || !allRecords) {
    return {
      today: { miles: 0, deduction: 0 },
      thisWeek: { miles: 0, deduction: 0 },
      thisMonth: { miles: 0, deduction: 0 },
      thisYear: { miles: 0, deduction: 0 },
    }
  }

  const todayMiles = allRecords
    .filter(r => new Date(r.created_at) >= todayStart)
    .reduce((sum, r) => sum + Number(r.miles_driven), 0)

  const weekMiles = allRecords
    .filter(r => new Date(r.created_at) >= weekStart)
    .reduce((sum, r) => sum + Number(r.miles_driven), 0)

  const monthMiles = allRecords
    .filter(r => new Date(r.created_at) >= monthStart)
    .reduce((sum, r) => sum + Number(r.miles_driven), 0)

  const yearMiles = allRecords
    .filter(r => new Date(r.created_at) >= yearStart)
    .reduce((sum, r) => sum + Number(r.miles_driven), 0)

  return {
    today: {
      miles: Math.round(todayMiles * 100) / 100,
      deduction: calculateMileageDeduction(todayMiles, irsRate),
    },
    thisWeek: {
      miles: Math.round(weekMiles * 100) / 100,
      deduction: calculateMileageDeduction(weekMiles, irsRate),
    },
    thisMonth: {
      miles: Math.round(monthMiles * 100) / 100,
      deduction: calculateMileageDeduction(monthMiles, irsRate),
    },
    thisYear: {
      miles: Math.round(yearMiles * 100) / 100,
      deduction: calculateMileageDeduction(yearMiles, irsRate),
    },
  }
}

/**
 * Export mileage records to CSV format
 */
export async function exportMileageToCSV(startDate?: string, endDate?: string): Promise<string> {
  const records = await getMileageRecords(startDate, endDate)
  const irsRate = getIRSRate()

  // CSV header
  const headers = ['Date', 'From Address', 'To Address', 'Miles', 'Notes', 'IRS Deduction']
  const rows = records.map(record => {
    const date = new Date(record.created_at).toLocaleDateString('en-US')
    const fromAddr = formatAddress(
      record.from_address,
      record.from_city,
      record.from_state,
      record.from_zip
    )
    const toAddr = formatAddress(
      record.to_address,
      record.to_city,
      record.to_state,
      record.to_zip
    )
    const deduction = calculateMileageDeduction(record.miles_driven, irsRate)

    return [
      date,
      `"${fromAddr}"`,
      `"${toAddr}"`,
      record.miles_driven.toString(),
      `"${record.notes || ''}"`,
      `$${deduction.toFixed(2)}`,
    ]
  })

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  return csv
}
