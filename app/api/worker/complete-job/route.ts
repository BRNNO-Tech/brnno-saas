import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInvoiceFromJob } from '@/lib/actions/invoices'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { jobId, assignmentId, notes } = await request.json()

    // Use service role client to bypass RLS
    const { createClient: createServiceClient } = await import('@/lib/supabase/service-client')
    const supabase = createServiceClient()

    console.log('Completing job:', { jobId, assignmentId })

    // Update job status to completed (using service role to bypass RLS)
    const { error: jobError } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (jobError) {
      console.error('Job update error:', jobError)
      throw jobError
    }

    // Update assignment status to completed
    const { error: assignmentError } = await supabase
      .from('job_assignments')
      .update({
        status: 'completed',
        notes: notes || null
      })
      .eq('id', assignmentId)

    if (assignmentError) {
      console.error('Assignment update error:', assignmentError)
      throw assignmentError
    }

    console.log('Job and assignment marked complete successfully')

    // Auto-generate invoice when job is completed
    try {
      await createInvoiceFromJob(jobId)
    } catch (error) {
      console.error('Failed to create invoice from job:', error)
      // Don't fail the job completion if invoice creation fails
    }

    // Revalidate worker pages to show updated data
    revalidatePath('/worker')
    revalidatePath('/worker/jobs')
    revalidatePath(`/worker/jobs/${jobId}`)
    revalidatePath('/dashboard/jobs')
    revalidatePath(`/dashboard/jobs/${jobId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Complete job error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    return NextResponse.json(
      { error: error?.message || 'Failed to complete job' },
      { status: 500 }
    )
  }
}
