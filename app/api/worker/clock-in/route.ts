import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId } = await request.json()
    const supabase = await createClient()

    // Update assignment with clock in time
    const { error: assignmentError } = await supabase
      .from('job_assignments')
      .update({
        clocked_in_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (assignmentError) throw assignmentError

    // Update job status to in_progress
    const { data: assignment } = await supabase
      .from('job_assignments')
      .select('job_id')
      .eq('id', assignmentId)
      .single()

    if (assignment) {
      await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', assignment.job_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clock in error:', error)
    return NextResponse.json(
      { error: 'Failed to clock in' },
      { status: 500 }
    )
  }
}
