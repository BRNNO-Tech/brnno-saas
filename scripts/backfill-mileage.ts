/**
 * One-time backfill: create job_mileage records for completed jobs that don't have one.
 * Uses Supabase service role key (bypasses RLS).
 *
 * Run with: npx ts-node --project scripts/tsconfig.json scripts/backfill-mileage.ts
 * (Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, e.g. from .env.local)
 */

const { createClient } = require('@supabase/supabase-js')
const { calculateDrivingDistance, formatAddress } = require('../lib/utils/mileage-utils')

const BUSINESS_ID = '5f3a6f70-79a6-4a72-aeae-afc9a2199917'

type JobRow = {
  id: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  completed_at: string | null
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local)'
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('[backfill-mileage] Fetching completed jobs for business', BUSINESS_ID)

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, address, city, state, zip, completed_at')
    .eq('business_id', BUSINESS_ID)
    .not('completed_at', 'is', null)
    .or('address.not.is.null,city.not.is.null,state.not.is.null,zip.not.is.null')
    .order('completed_at', { ascending: true })

  if (jobsError) {
    console.error('[backfill-mileage] Failed to fetch jobs:', jobsError)
    process.exit(1)
  }

  if (!jobs || jobs.length === 0) {
    console.log('[backfill-mileage] No completed jobs found.')
    return
  }

  console.log('[backfill-mileage] Found', jobs.length, 'completed job(s). Processing from 2nd job onward.\n')

  let created = 0
  const typedJobs = jobs as JobRow[]

  for (let i = 1; i < typedJobs.length; i++) {
    const previousJob = typedJobs[i - 1]
    const currentJob = typedJobs[i]
    const jobId = currentJob.id

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

    if (
      !fromAddress ||
      !toAddress ||
      fromAddress === 'Unknown location' ||
      toAddress === 'Unknown location'
    ) {
      console.log('[backfill-mileage] skip:', {
        reason: 'missing_addresses',
        jobId,
        fromAddress: fromAddress || null,
        toAddress: toAddress || null,
      })
      continue
    }

    const { data: existing } = await supabase
      .from('job_mileage')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle()

    if (existing) {
      console.log('[backfill-mileage] skip:', {
        reason: 'job_already_has_mileage_record',
        jobId,
        mileageRecordId: existing.id,
      })
      continue
    }

    let miles: number
    try {
      miles = await calculateDrivingDistance(fromAddress, toAddress)
    } catch (err) {
      console.log('[backfill-mileage] skip:', {
        reason: 'distance_calculation_error',
        jobId,
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    if (miles < 0.5) {
      console.log('[backfill-mileage] skip:', {
        reason: 'distance_too_short',
        jobId,
        miles,
        threshold: 0.5,
      })
      continue
    }

    const completedAt = currentJob.completed_at ?? new Date().toISOString()

    const { data: inserted, error: insertError } = await supabase
      .from('job_mileage')
      .insert({
        business_id: BUSINESS_ID,
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
        created_at: completedAt,
        updated_at: completedAt,
      })
      .select('id, miles_driven')
      .single()

    if (insertError) {
      console.log('[backfill-mileage] skip:', {
        reason: 'insert_failed',
        jobId,
        error: insertError.message,
        code: insertError.code,
      })
      continue
    }

    created++
    console.log('[backfill-mileage] created:', {
      jobId,
      previousJobId: previousJob.id,
      mileageRecordId: inserted?.id,
      miles: inserted?.miles_driven,
    })
  }

  console.log('\n[backfill-mileage] Done. Total records created:', created)
}

main().catch((err) => {
  console.error('[backfill-mileage] Fatal error:', err)
  process.exit(1)
})
