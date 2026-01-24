import { createClient } from '@/lib/supabase/server'
import { getWorkerProfile } from '@/lib/actions/worker-auth'
import { getJobPhotos } from '@/lib/actions/job-photos'
import type { JobPhoto } from '@/lib/actions/job-photos'
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

  // Get photos for this job (includes both booking photos and job photos)
  let jobPhotos: JobPhoto[] = []
  try {
    jobPhotos = await getJobPhotos(resolvedParams.id)
  } catch (error) {
    console.error('Error loading photos:', error)
    // Don't fail the page if photos can't be loaded
  }

  // Convert JobPhoto[] to Photo[] format expected by WorkerJobDetail
  const photos = jobPhotos.map(photo => ({
    id: photo.id,
    photo_type: photo.photo_type,
    storage_url: photo.storage_url,
    description: photo.description ?? null,
    uploaded_at: photo.uploaded_at
  }))

  return <WorkerJobDetail assignment={assignment} worker={worker} initialPhotos={photos} />
}
