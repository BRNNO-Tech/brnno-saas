import { getJob } from '@/lib/actions/jobs'
import { getJobPhotos } from '@/lib/actions/job-photos'
import { getAllJobPhotos, type UnifiedJobPhotos } from '@/lib/actions/unified-job-photos'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'
import AssignJobDialog from '@/components/jobs/assign-job-dialog'
import { UnifiedJobPhotoGallery } from '@/components/jobs/unified-job-photo-gallery'
import { Calendar, Clock, DollarSign, MapPin, User, FileText, ArrowLeft, Car } from 'lucide-react'
import Link from 'next/link'
import { JobDateDisplay } from '@/components/jobs/job-date-display'
import { MileageDisplay } from '@/components/mileage/mileage-display'

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-700 dark:text-green-300'
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-700 dark:text-blue-300'
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-700 dark:text-red-300'
      }
    default:
      return {
        label: 'Scheduled',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-300'
      }
  }
}

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const job = await getJob(id)

    if (!job) notFound()

    // Fetch all photos for this job (booking + job photos)
    let allPhotos: UnifiedJobPhotos = {
      booking_photos: [],
      job_photos: [],
      all_photos: [],
      total_count: 0,
      before_count: 0,
      after_count: 0,
      timeline: []
    }
    try {
      allPhotos = await getAllJobPhotos(id)
    } catch (error) {
      console.error('Error fetching photos:', error)
      // Fallback to just job photos if unified fetch fails
      try {
        const jobPhotos = await getJobPhotos(id)
        allPhotos = {
          booking_photos: [],
          job_photos: jobPhotos || [],
          all_photos: jobPhotos || [],
          total_count: jobPhotos?.length || 0,
          before_count: 0,
          after_count: jobPhotos?.length || 0,
          timeline: (jobPhotos || []).map(photo => ({
            phase: 'job' as const,
            photo,
            timestamp: photo.uploaded_at || new Date().toISOString()
          }))
        }
      } catch (fallbackError) {
        console.error('Error fetching job photos:', fallbackError)
      }
    }

    const statusConfig = getStatusConfig(job.status)

    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>

          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            {/* Header with Back Button */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/jobs">
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                </Link>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                      {job.title}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
                      <span className={`text-xs font-semibold uppercase ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    {job.priority === 'urgent' && (
                      <Badge variant="destructive" className="ml-2">
                        Urgent
                      </Badge>
                    )}
                    {job.priority === 'high' && (
                      <Badge variant="secondary" className="ml-2">
                        High
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                    Job ID: {job.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <AssignJobDialog
                  jobId={job.id}
                  currentAssignment={
                    job.assignments?.[0]?.team_member
                      ? {
                        id: job.assignments[0].team_member.id,
                        name: job.assignments[0].team_member.name
                      }
                      : null
                  }
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Main Details */}
              <div className="md:col-span-2 space-y-6">
                <CardShell title="Job Details" subtitle="Service information and scheduling">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Scheduled Date</p>
                      <JobDateDisplay scheduledDate={job.scheduled_date} />
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Service Type</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{job.service_type || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Estimated Duration</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {job.estimated_duration ? `${job.estimated_duration} mins` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Estimated Cost</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">
                          {job.estimated_cost ? `$${job.estimated_cost.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {job.mileage_record && (
                      <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                        <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Mileage</p>
                        <MileageDisplay
                          jobId={job.id}
                          mileageId={job.mileage_record.id}
                          miles={job.mileage_record.miles_driven}
                          isManualOverride={job.mileage_record.is_manual_override}
                          fromAddress={job.mileage_record.from_address ? 
                            `${job.mileage_record.from_address}, ${job.mileage_record.from_city || ''} ${job.mileage_record.from_state || ''}`.trim() : 
                            undefined
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Vehicle/Asset Details */}
                  {job.asset_details && Object.keys(job.asset_details).length > 0 && (
                    <div className="flex items-start gap-2 mb-4 p-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
                      <Car className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-zinc-600 dark:text-white/45 mb-1">Vehicle Details</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {Object.entries(job.asset_details)
                            .map(([key, value]) => value)
                            .join(' • ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-200/50 dark:border-white/10">
                    <p className="text-xs text-zinc-600 dark:text-white/45 mb-2">Description</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {job.description || 'No description provided.'}
                    </p>
                  </div>
                </CardShell>

                <CardShell title="Location" subtitle="Service address and location details">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {job.address ? (
                        <>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{job.address}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{job.city}, {job.state} {job.zip}</p>
                          {job.is_mobile_service && (
                            <Badge variant="secondary" className="mt-2">Mobile Service</Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">No address provided</p>
                      )}
                    </div>
                  </div>
                </CardShell>

                <CardShell title="Notes" subtitle="Client and internal notes">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-white/45">Client Notes</p>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {job.client_notes || 'None'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-white/45">Internal Notes</p>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {job.internal_notes || 'None'}
                      </p>
                    </div>
                  </div>
                </CardShell>

                {/* Unified Job Photos Gallery (Booking + Job Photos) */}
                <UnifiedJobPhotoGallery 
                  jobId={job.id} 
                  bookingPhotos={allPhotos.booking_photos}
                  jobPhotos={allPhotos.job_photos}
                  readOnly={false}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <CardShell title="Client Info" subtitle="Customer details">
                  {job.client ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {job.client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-zinc-900 dark:text-white">{job.client.name}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">Client</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm pt-3 border-t border-zinc-200/50 dark:border-white/10">
                        {job.client.email && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Email:</span>
                            <a href={`mailto:${job.client.email}`} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">
                              {job.client.email}
                            </a>
                          </div>
                        )}
                        {job.client.phone && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Phone:</span>
                            <a href={`tel:${job.client.phone}`} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">
                              {job.client.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">No client associated</p>
                  )}
                </CardShell>

                <CardShell title="Assignment" subtitle="Team member assignment">
                  {job.assignments && job.assignments.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {job.assignments[0].team_member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-zinc-900 dark:text-white">{job.assignments[0].team_member.name}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {job.assignments[0].team_member.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-zinc-200/50 dark:border-white/10">
                        <AssignJobDialog
                          jobId={job.id}
                          currentAssignment={{
                            id: job.assignments[0].team_member.id,
                            name: job.assignments[0].team_member.name
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">No team member assigned</p>
                      <AssignJobDialog jobId={job.id} currentAssignment={null} />
                    </div>
                  )}
                </CardShell>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
