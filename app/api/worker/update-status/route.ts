import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, jobId, status } = await request.json()
    const supabase = await createClient()

    // Verify worker has access to this assignment
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: worker } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 403 })
    }

    // Verify assignment belongs to worker
    const { data: assignment } = await supabase
      .from('job_assignments')
      .select('id, team_member_id')
      .eq('id', assignmentId)
      .eq('team_member_id', worker.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Update assignment status
    const assignmentStatusMap: Record<string, string> = {
      'on_my_way': 'assigned',
      'arrived': 'assigned',
      'in_progress': 'in_progress'
    }

    const { error: assignmentError } = await supabase
      .from('job_assignments')
      .update({
        status: assignmentStatusMap[status] || 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (assignmentError) throw assignmentError

    // Update job status if needed
    if (status === 'in_progress') {
      await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}

