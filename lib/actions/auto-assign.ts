'use server'

import { createClient } from '@/lib/supabase/server'
import { getBusinessId } from './utils'
import { assignJobToMember } from './team'
import { canUseAutoAssignment, getCurrentTier } from './permissions'
import { getTierFromBusiness } from '@/lib/permissions'

type WorkerScore = {
  workerId: string
  score: number
  reasons: string[]
}

type AssignmentRule = {
  rule_type: 'skills_match' | 'round_robin' | 'load_balance' | 'proximity' | 'priority'
  priority: number
  enabled: boolean
  config: Record<string, any>
}

/**
 * Finds the best worker for a job using rule-based matching
 */
export async function findBestWorkerForJob(jobId: string): Promise<{ workerId: string | null; confidence: number; reasons: string[] }> {
  const canUse = await canUseAutoAssignment()
  if (!canUse) {
    throw new Error('Auto-assignment is not available on your plan. Upgrade to Pro or Fleet.')
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, client:clients(*)')
    .eq('id', jobId)
    .eq('business_id', businessId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Get active team members
  const { data: teamMembers, error: membersError } = await supabase
    .from('team_members')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')

  if (membersError || !teamMembers || teamMembers.length === 0) {
    return { workerId: null, confidence: 0, reasons: ['No active team members available'] }
  }

  // Get current assignments for load balancing
  const { data: currentAssignments } = await supabase
    .from('job_assignments')
    .select('team_member_id, job:jobs(scheduled_date, status)')
    .in('team_member_id', teamMembers.map(m => m.id))

  // Score each worker
  const workerScores: WorkerScore[] = teamMembers.map(worker => {
    let score = 0
    const reasons: string[] = []

    // 1. Skills matching (if job has service_type and worker has skills)
    if (job.service_type && worker.skills && Array.isArray(worker.skills)) {
      const hasSkill = worker.skills.some((skill: string) => 
        skill.toLowerCase().includes(job.service_type!.toLowerCase()) ||
        job.service_type!.toLowerCase().includes(skill.toLowerCase())
      )
      if (hasSkill) {
        score += 30
        reasons.push('Skills match')
      } else {
        score -= 10
        reasons.push('Skills mismatch')
      }
    }

    // 2. Load balancing - prefer workers with fewer assignments
    const workerAssignments = currentAssignments?.filter(a => {
      if (a.team_member_id !== worker.id) return false
      const job = Array.isArray(a.job) ? a.job[0] : a.job
      return job && job.status !== 'completed'
    }) || []
    
    const assignmentCount = workerAssignments.length
    const maxJobs = worker.max_jobs_per_day || 5
    
    if (assignmentCount < maxJobs) {
      const loadScore = (maxJobs - assignmentCount) * 5
      score += loadScore
      reasons.push(`Low workload (${assignmentCount}/${maxJobs} jobs)`)
    } else {
      score -= 50 // Heavily penalize over-capacity
      reasons.push(`At capacity (${assignmentCount}/${maxJobs} jobs)`)
    }

    // 3. Availability check (basic - check if worker has jobs at same time)
    if (job.scheduled_date) {
      const jobDate = new Date(job.scheduled_date)
      const hasConflict = workerAssignments.some(assignment => {
        const assignmentJob = Array.isArray(assignment.job) ? assignment.job[0] : assignment.job
        if (!assignmentJob?.scheduled_date) return false
        const assignmentDate = new Date(assignmentJob.scheduled_date)
        // Check if same day (basic check)
        return jobDate.toDateString() === assignmentDate.toDateString()
      })
      
      if (!hasConflict) {
        score += 15
        reasons.push('Available on scheduled date')
      } else {
        score -= 20
        reasons.push('Potential schedule conflict')
      }
    }

    // 4. Preferred service types (if worker has preferences)
    if (worker.preferred_service_types && Array.isArray(worker.preferred_service_types) && job.service_type) {
      const prefersThis = worker.preferred_service_types.some((pref: string) =>
        pref.toLowerCase().includes(job.service_type!.toLowerCase())
      )
      if (prefersThis) {
        score += 10
        reasons.push('Preferred service type')
      }
    }

    // 5. Round-robin bonus (slight preference for workers with fewer recent assignments)
    const recentAssignments = workerAssignments.filter(a => {
      const assignmentJob = Array.isArray(a.job) ? a.job[0] : a.job
      if (!assignmentJob?.scheduled_date) return false
      const assignmentDate = new Date(assignmentJob.scheduled_date)
      const now = new Date()
      const daysDiff = (assignmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff >= 0 && daysDiff <= 7 // Next 7 days
    })
    
    if (recentAssignments.length === 0) {
      score += 5
      reasons.push('No upcoming assignments')
    }

    return { workerId: worker.id, score, reasons }
  })

  // Sort by score (highest first)
  workerScores.sort((a, b) => b.score - a.score)

  const bestWorker = workerScores[0]

  if (!bestWorker || bestWorker.score < 0) {
    return { 
      workerId: null, 
      confidence: 0, 
      reasons: ['No suitable worker found. All workers may be at capacity or unavailable.'] 
    }
  }

  // Calculate confidence (0-1 scale)
  const maxPossibleScore = 60 // Rough estimate of max score
  const confidence = Math.min(bestWorker.score / maxPossibleScore, 1)

  return {
    workerId: bestWorker.workerId,
    confidence,
    reasons: bestWorker.reasons
  }
}

/**
 * Auto-assigns a job to the best available worker
 */
export async function autoAssignJob(jobId: string): Promise<{ success: boolean; workerId: string | null; message: string }> {
  try {
    const result = await findBestWorkerForJob(jobId)
    
    if (!result.workerId) {
      return {
        success: false,
        workerId: null,
        message: result.reasons.join('. ') || 'No suitable worker found'
      }
    }

    // Assign the job
    await assignJobToMember(jobId, result.workerId)

    // Update assignment method in job_assignments
    const supabase = await createClient()
    await supabase
      .from('job_assignments')
      .update({ 
        assignment_method: 'rule_based',
        assignment_confidence: result.confidence
      })
      .eq('job_id', jobId)
      .eq('team_member_id', result.workerId)

    const workerName = await getWorkerName(result.workerId)
    
    return {
      success: true,
      workerId: result.workerId,
      message: `Job assigned to ${workerName} (${Math.round(result.confidence * 100)}% confidence)`
    }
  } catch (error) {
    console.error('Error in auto-assignment:', error)
    return {
      success: false,
      workerId: null,
      message: error instanceof Error ? error.message : 'Failed to auto-assign job'
    }
  }
}

/**
 * Auto-assigns all unassigned jobs
 */
export async function autoAssignUnassignedJobs(): Promise<{ assigned: number; failed: number; results: Array<{ jobId: string; success: boolean; message: string }> }> {
  const canUse = await canUseAutoAssignment()
  if (!canUse) {
    throw new Error('Auto-assignment is not available on your plan')
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get all unassigned jobs (jobs without assignments)
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('business_id', businessId)
    .eq('status', 'scheduled')

  if (!allJobs || allJobs.length === 0) {
    return { assigned: 0, failed: 0, results: [] }
  }

  // Get all assigned job IDs
  const { data: assignments } = await supabase
    .from('job_assignments')
    .select('job_id')
    .in('job_id', allJobs.map(j => j.id))

  const assignedJobIds = new Set(assignments?.map(a => a.job_id) || [])
  const jobs = allJobs.filter(job => !assignedJobIds.has(job.id))

  if (!jobs || jobs.length === 0) {
    return { assigned: 0, failed: 0, results: [] }
  }

  const results = await Promise.allSettled(
    jobs.map(job => autoAssignJob(job.id))
  )

  const assigned = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - assigned

  return {
    assigned,
    failed,
    results: results.map((r, i) => ({
      jobId: jobs[i].id,
      success: r.status === 'fulfilled' && r.value.success,
      message: r.status === 'fulfilled' ? r.value.message : 'Assignment failed'
    }))
  }
}

/**
 * Helper to get worker name
 */
async function getWorkerName(workerId: string): Promise<string> {
  const supabase = await createClient()
  const { data: worker } = await supabase
    .from('team_members')
    .select('name')
    .eq('id', workerId)
    .single()
  
  return worker?.name || 'Unknown Worker'
}

/**
 * Checks if auto-assignment is enabled for the business
 */
export async function isAutoAssignmentEnabled(): Promise<boolean> {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: business } = await supabase
    .from('businesses')
    .select('auto_assignment_enabled, auto_assignment_method')
    .eq('id', businessId)
    .single()

  return business?.auto_assignment_enabled === true && 
         (business?.auto_assignment_method === 'rule_based' || business?.auto_assignment_method === 'ai')
}

/**
 * Gets auto-assignment settings
 */
export async function getAutoAssignmentSettings() {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: business } = await supabase
    .from('businesses')
    .select('auto_assignment_enabled, auto_assignment_method, auto_assignment_rules')
    .eq('id', businessId)
    .single()

  return {
    enabled: business?.auto_assignment_enabled || false,
    method: business?.auto_assignment_method || 'manual',
    rules: business?.auto_assignment_rules || {}
  }
}

/**
 * Updates auto-assignment settings
 */
export async function updateAutoAssignmentSettings(settings: {
  enabled: boolean
  method: 'manual' | 'rule_based' | 'ai'
}) {
  const canUse = await canUseAutoAssignment()
  if (!canUse && settings.enabled) {
    throw new Error('Auto-assignment is not available on your plan. Upgrade to Pro or Fleet.')
  }

  // Check if AI method requires AI add-on
  if (settings.method === 'ai') {
    const supabase = await createClient()
    const businessId = await getBusinessId()
    
    const { data: hasAddon } = await supabase
      .rpc('business_has_ai_addon', {
        business_id_param: businessId,
        addon_id_param: 'job-assignment'
      })

    if (!hasAddon) {
      throw new Error('AI Job Assignment add-on required. Subscribe in Settings → Add-ons.')
    }
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { error } = await supabase
    .from('businesses')
    .update({
      auto_assignment_enabled: settings.enabled,
      auto_assignment_method: settings.method
    })
    .eq('id', businessId)

  if (error) throw error
}
