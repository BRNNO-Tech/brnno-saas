import { createClient } from '@/lib/supabase/client'
import { getWorkerProfile } from '@/lib/actions/worker-auth'
import { notFound, redirect } from 'next/navigation'
import WorkerJobDetail from '@/components/worker/worker-job-detail'



export const dynamic = 'force-dynamic'

export default async function WorkerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const worker = await getWorkerProfile()

  if (!worker) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get job assignment for this worker
  const { data: assignment } = await supabase
    .from('job_assignments')
    .select(`
      *,
      job:jobs(
        *,
        client:clients(*)
      )
    `)
    .eq('job_id', resolvedParams.id)
    .eq('team_member_id', worker.id)
    .single()

  if (!assignment) {
    notFound()
  }

  return <WorkerJobDetail assignment={assignment} worker={worker} />
}
