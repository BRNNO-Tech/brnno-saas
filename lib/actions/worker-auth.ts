'use server'

import { createClient } from '@/lib/supabase/server'

export async function getWorkerProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find team member by user_id (they're now linked after signup)
  const { data: worker } = await supabase
    .from('team_members')
    .select('*, business:businesses(name)')
    .eq('user_id', user.id)
    .maybeSingle()

  return worker
}

export async function getWorkerJobs() {
  const supabase = await createClient()

  const worker = await getWorkerProfile()
  if (!worker) throw new Error('Not a worker')

  const { data: assignments, error } = await supabase
    .from('job_assignments')
    .select(`
      *,
      job:jobs(
        *,
        client:clients(name, phone, email)
      )
    `)
    .eq('team_member_id', worker.id)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  
  return assignments || []
}
