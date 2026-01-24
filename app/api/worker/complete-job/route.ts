import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInvoiceFromJob } from '@/lib/actions/invoices'

export async function POST(request: NextRequest) {
  try {
    const { jobId, assignmentId, notes } = await request.json()
    const supabase = await createClient()

    // Update job status to completed
    const { error: jobError } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (jobError) throw jobError

    // Update assignment notes
    if (notes) {
      await supabase
        .from('job_assignments')
        .update({ notes })
        .eq('id', assignmentId)
    }

    // Auto-generate invoice when job is completed
    try {
      await createInvoiceFromJob(jobId)
    } catch (error) {
      console.error('Failed to create invoice from job:', error)
      // Don't fail the job completion if invoice creation fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete job error:', error)
    return NextResponse.json(
      { error: 'Failed to complete job' },
      { status: 500 }
    )
  }
}
