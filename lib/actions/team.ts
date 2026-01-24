'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockTeamMembers } from '@/lib/demo/mock-data'

export async function getTeamMembers() {
  if (await isDemoMode()) {
    return getMockTeamMembers()
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, name, email, phone, role, skills, hourly_rate, commission_rate, status, user_id, created_at, updated_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return members || []
}

export async function createTeamMember(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  const skills = formData.get('skills') as string
  const skillsArray = skills ? skills.split(',').map(s => s.trim()) : []

  const memberData = {
    business_id: business.id,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    role: formData.get('role') as string || 'worker',
    skills: skillsArray,
    hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
    status: 'active',
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert(memberData)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/team')
  return data
}

export async function updateTeamMember(id: string, formData: FormData) {
  const supabase = await createClient()

  const skills = formData.get('skills') as string
  const skillsArray = skills ? skills.split(',').map(s => s.trim()) : []

  const updates = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    role: formData.get('role') as string,
    skills: skillsArray,
    hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
  }

  const { error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/team')
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/team')
}

export async function assignJobToMember(jobId: string, memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from('job_assignments')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) {
    // Update existing assignment
    const { error } = await supabase
      .from('job_assignments')
      .update({
        team_member_id: memberId,
        assigned_at: new Date().toISOString(),
      })
      .eq('job_id', jobId)

    if (error) throw error
  } else {
    // Create new assignment
    const assignmentData: any = {
      job_id: jobId,
      team_member_id: memberId,
      assigned_at: new Date().toISOString(),
    }

    // Only add assigned_by if the column exists (check by trying to insert)
    // For now, we'll skip it to avoid schema issues
    const { error } = await supabase
      .from('job_assignments')
      .insert(assignmentData)

    if (error) {
      // If unique constraint violation, update instead
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('job_assignments')
          .update({
            team_member_id: memberId,
            assigned_at: new Date().toISOString(),
          })
          .eq('job_id', jobId)

        if (updateError) throw updateError
      } else {
        throw error
      }
    }
  }

  revalidatePath('/dashboard/jobs')
}

/**
 * Unassigns a job (removes the assignment)
 */
export async function unassignJob(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete the assignment
  const { error } = await supabase
    .from('job_assignments')
    .delete()
    .eq('job_id', jobId)

  if (error) throw error

  revalidatePath('/dashboard/jobs')
}

export async function getJobAssignments(jobId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_assignments')
    .select(`
      *,
      team_member:team_members(*)
    `)
    .eq('job_id', jobId)

  if (error) throw error
  return data || []
}

export async function getMemberJobs(memberId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_assignments')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('team_member_id', memberId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}
