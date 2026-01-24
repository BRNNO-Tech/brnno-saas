import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId } = await request.json()
    const supabase = await createClient()

    // Get assignment to calculate duration
    const { data: assignment } = await supabase
      .from('job_assignments')
      .select('clocked_in_at')
      .eq('id', assignmentId)
      .single()

    if (!assignment?.clocked_in_at) {
      return NextResponse.json(
        { error: 'Not clocked in' },
        { status: 400 }
      )
    }

    const clockedOut = new Date()
    const clockedIn = new Date(assignment.clocked_in_at)
    const durationMinutes = Math.round((clockedOut.getTime() - clockedIn.getTime()) / 60000)

    // Update assignment with clock out time and duration
    const { error } = await supabase
      .from('job_assignments')
      .update({
        clocked_out_at: clockedOut.toISOString(),
        actual_duration: durationMinutes,
      })
      .eq('id', assignmentId)

    if (error) throw error

    return NextResponse.json({ success: true, duration: durationMinutes })
  } catch (error) {
    console.error('Clock out error:', error)
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    )
  }
}
