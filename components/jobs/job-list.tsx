'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Trash2, Play, CheckCircle, Edit, MapPin,
  Car, Clock, User, Calendar, Navigation
} from 'lucide-react'
import { deleteJob, updateJobStatus } from '@/lib/actions/jobs'
import EditJobSheet from './edit-job-dialog'
import { formatJobDate } from '@/lib/utils/date-format'
import { MileageDisplay } from '@/components/mileage/mileage-display'
import { PhotoCountBadge } from '@/components/jobs/photo-count-badge'

type Job = {
  id: string
  business_id: string
  title: string
  description: string | null
  service_type: string | null
  scheduled_date: string | null
  estimated_cost: number | null
  estimated_duration: number | null
  status: string
  priority: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  is_mobile_service: boolean
  client_notes: string | null
  internal_notes: string | null
  client_id: string | null
  client: { name: string; phone?: string } | null
  assignments?: { id: string; team_member: { id: string; name: string; role: string } }[]
  asset_details?: Record<string, any> | null
  mileage_record?: {
    id: string
    miles_driven: number
    is_manual_override: boolean
    from_address: string | null
    from_city: string | null
    from_state: string | null
    from_zip: string | null
  } | null
  photo_count?: number
  addons?: Array<{ id?: string; name: string; price?: number }> | null
  vehicle_condition?: string | null
  stripe_payment_intent_id?: string | null
  payment_captured?: boolean | null
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getLocalDateAtMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function groupByDate(jobs: Job[]): { label: string; jobs: Job[]; sortKey: number }[] {
  const groups: Record<string, Job[]> = {}
  const now = new Date()
  const today = getLocalDateAtMidnight(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  jobs.forEach(job => {
    if (!job.scheduled_date) {
      groups['No Date'] = groups['No Date'] || []
      groups['No Date'].push(job)
      return
    }
    const jobDate = getLocalDateAtMidnight(new Date(job.scheduled_date))
    let label: string
    if (jobDate.getTime() === today.getTime()) label = 'Today'
    else if (jobDate.getTime() === tomorrow.getTime()) label = 'Tomorrow'
    else label = jobDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    groups[label] = groups[label] || []
    groups[label].push(job)
  })

  return Object.entries(groups)
    .map(([label, groupJobs]) => ({
      label,
      jobs: groupJobs,
      sortKey: label === 'No Date' ? Infinity : (groupJobs[0]?.scheduled_date ? new Date(groupJobs[0].scheduled_date).getTime() : Infinity),
    }))
    .sort((a, b) => {
      if (a.label === 'No Date') return 1
      if (b.label === 'No Date') return -1
      return a.sortKey - b.sortKey
    })
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'completed': return { indicator: 'bg-[var(--dash-green)]', badge: 'text-[var(--dash-green)] border-[var(--dash-green)]/30', bar: 'bg-[var(--dash-green)]', label: 'Completed' }
    case 'in_progress': return { indicator: 'bg-[var(--dash-amber)] shadow-[0_0_8px_var(--dash-amber-dim)]', badge: 'text-[var(--dash-amber)] border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)]', bar: 'bg-[var(--dash-amber)] shadow-[0_0_6px_var(--dash-amber-dim)]', label: 'In Progress' }
    case 'cancelled': return { indicator: 'bg-[var(--dash-red)]', badge: 'text-[var(--dash-red)] border-[var(--dash-red)]/30', bar: 'bg-[var(--dash-red)]', label: 'Cancelled' }
    case 'no_show': return { indicator: 'bg-[var(--dash-red)]', badge: 'text-[var(--dash-red)] border-[var(--dash-red)]/30', bar: 'bg-[var(--dash-red)]', label: 'No-Show' }
    default: return { indicator: 'bg-[var(--dash-blue)]', badge: 'text-[var(--dash-blue)] border-[var(--dash-blue)]/30', bar: 'bg-[var(--dash-blue)]', label: 'Scheduled' }
  }
}

const TABS = ['today', 'upcoming', 'past'] as const
type Tab = (typeof TABS)[number]

export default function JobList({ jobs, teamMembers }: { jobs: Job[]; teamMembers?: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    try {
      await deleteJob(id)
      router.refresh()
    } catch {
      toast.error('Failed to delete job')
    }
  }

  async function handleStatusChange(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      const targetJob = jobs.find((j) => j.id === id)
      const hasUncapturedHold = Boolean(targetJob?.stripe_payment_intent_id && !targetJob?.payment_captured)
      if (status === 'cancelled' && targetJob?.business_id) {
        const res = await fetch('/api/cancel-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: id, businessId: targetJob.business_id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || 'Failed to cancel booking')
        }
      } else {
        await updateJobStatus(id, status)
      }
      if (status === 'in_progress') toast.success('Job started')
      else if (status === 'completed') toast.success('Job completed')
      else toast.success('Status updated')
      router.refresh()
    } catch (error: unknown) {
      toast.error('Failed to update job', { description: error instanceof Error ? error.message : undefined })
    }
  }

  const now = new Date()
  const today = getLocalDateAtMidnight(now)

  const todayJobs = jobs.filter(j => j.scheduled_date && getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() === today.getTime())
  const upcomingJobs = jobs.filter(j => j.scheduled_date && getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() > today.getTime())
  const pastJobs = jobs.filter(j => !j.scheduled_date || getLocalDateAtMidnight(new Date(j.scheduled_date)).getTime() < today.getTime())
  const upcomingGroups = groupByDate(upcomingJobs)

  const tabCounts = { today: todayJobs.length, upcoming: upcomingJobs.length, past: pastJobs.length }

  if (jobs.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <Car className="h-10 w-10 mx-auto mb-4 text-[var(--dash-text-muted)]" />
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No Jobs Yet</div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Create your first job to get started</div>
      </div>
    )
  }

  return (
    <>
      {/* Tab bar */}
      <div className="flex border border-[var(--dash-border)] bg-[var(--dash-border)] gap-px mb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider transition-colors',
              activeTab === tab
                ? 'bg-[var(--dash-graphite)] text-[var(--dash-amber)]'
                : 'bg-[var(--dash-surface)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text-dim)]'
            )}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span className={cn(
                'font-dash-mono text-[10px] px-1.5 py-0.5 border',
                activeTab === tab
                  ? 'border-[var(--dash-amber)]/40 text-[var(--dash-amber)] bg-[var(--dash-amber-glow)]'
                  : 'border-[var(--dash-border-bright)] text-[var(--dash-text-muted)]'
              )}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Today */}
      {activeTab === 'today' && (
        <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          {todayJobs.length === 0 ? (
            <div className="bg-[var(--dash-graphite)] px-6 py-12 text-center">
              <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">Clear Schedule</div>
              <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No jobs today — time to close some leads</div>
            </div>
          ) : (
            todayJobs.map(job => (
              <JobCard key={job.id} job={job} onEdit={setEditingJob} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      )}

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          {upcomingJobs.length === 0 ? (
            <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-12 text-center">
              <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No upcoming jobs</div>
            </div>
          ) : (
            upcomingGroups.map(({ label, jobs: groupJobs }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.2em]">{label}</span>
                  <div className="flex-1 h-px bg-[var(--dash-border)]" />
                </div>
                <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
                  {groupJobs.map(job => (
                    <JobCard key={job.id} job={job} onEdit={setEditingJob} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Past */}
      {activeTab === 'past' && (
        <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          {pastJobs.length === 0 ? (
            <div className="bg-[var(--dash-graphite)] px-6 py-12 text-center">
              <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No past jobs</div>
            </div>
          ) : (
            pastJobs.map(job => (
              <JobCard key={job.id} job={job} onEdit={setEditingJob} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      )}

      {editingJob && (
        <EditJobSheet
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
        />
      )}
    </>
  )
}

function JobCard({
  job,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => void
}) {
  const s = getStatusStyle(job.status)
  const hasUncapturedHold = Boolean(job.stripe_payment_intent_id && !job.payment_captured)
  const [markingNoShow, setMarkingNoShow] = useState(false)
  const router = useRouter()

  async function handleNoShow(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!job.business_id) return
    setMarkingNoShow(true)
    try {
      const res = await fetch('/api/noshow-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, businessId: job.business_id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark no-show')
      }
      toast.success('Marked as no-show')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark no-show')
    } finally {
      setMarkingNoShow(false)
    }
  }

  return (
    <div className="bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors">
      {/* Top strip */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Status bar */}
        <div className={cn('w-0.5 h-10 rounded-sm flex-shrink-0', s.bar)} />

        {/* Main info */}
        <Link href={`/dashboard/jobs/${job.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('font-dash-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider', s.badge)}>
              {s.label}
            </span>
            {job.photo_count !== undefined && job.photo_count > 0 && (
              <PhotoCountBadge count={job.photo_count} size="sm" />
            )}
          </div>
          <div className="font-dash-condensed font-bold text-[17px] text-[var(--dash-text)] truncate leading-tight">
            {job.client?.name ?? job.title}
          </div>
          {job.service_type && (
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-0.5 truncate">{job.service_type}</div>
          )}
        </Link>

        {/* Price */}
        {job.estimated_cost && (
          <div className="font-dash-condensed font-bold text-xl text-[var(--dash-amber)] flex-shrink-0">
            ${job.estimated_cost.toFixed(0)}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(job) }}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(job.id) }}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 pl-[28px]">
        {job.scheduled_date && (
          <div className="flex items-center gap-1.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            {formatJobDate(job.scheduled_date)}
          </div>
        )}
        {job.estimated_duration && (
          <div className="flex items-center gap-1.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            <Clock className="h-3 w-3 flex-shrink-0" />
            {job.estimated_duration}min
          </div>
        )}
        {job.assignments && job.assignments.length > 0 && (
          <div className="flex items-center gap-1.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            <User className="h-3 w-3 flex-shrink-0" />
            {job.assignments[0].team_member.name}
          </div>
        )}
        {job.addons && job.addons.length > 0 && (
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            +{job.addons.map(a => a.name).join(', ')}
          </div>
        )}
      </div>

      {/* Address row */}
      {(job.address || job.city) && (
        <div className="flex items-center gap-2 px-4 pb-3 pl-[28px]">
          <MapPin className="h-3 w-3 text-[var(--dash-text-muted)] flex-shrink-0" />
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${job.address ?? ''}, ${job.city ?? ''} ${job.state ?? ''} ${job.zip ?? ''}`.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)] truncate transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {job.address ? `${job.address}, ${job.city}, ${job.state}` : `${job.city}, ${job.state}`}
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${job.address ?? ''}, ${job.city ?? ''} ${job.state ?? ''} ${job.zip ?? ''}`.trim())}`, '_blank')
            }}
            className="flex items-center gap-1 px-2 py-1 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[11px] uppercase tracking-wide text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
          >
            <Navigation className="h-3 w-3" />
            Route
          </button>
        </div>
      )}

      {/* Mileage */}
      {job.mileage_record && (
        <div className="px-4 pb-3 pl-[28px]">
          <MileageDisplay
            jobId={job.id}
            mileageId={job.mileage_record.id}
            miles={job.mileage_record.miles_driven}
            isManualOverride={job.mileage_record.is_manual_override}
            fromAddress={job.mileage_record.from_address ? `${job.mileage_record.from_address}, ${job.mileage_record.from_city ?? ''} ${job.mileage_record.from_state ?? ''}`.trim() : undefined}
          />
        </div>
      )}

      {/* Action button */}
      {(job.status === 'scheduled' || job.status === 'in_progress') && (
        <div className="px-4 pb-4 pl-[28px]">
          {job.status === 'scheduled' && (
            <button
              onClick={(e) => { e.preventDefault(); onStatusChange(job.id, 'in_progress') }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <Play className="h-3.5 w-3.5" />
              Start Job
            </button>
          )}
          {job.status === 'in_progress' && (
            <button
              onClick={(e) => { e.preventDefault(); onStatusChange(job.id, 'completed') }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--dash-green)] text-[var(--dash-black)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete Job
            </button>
          )}
          {hasUncapturedHold && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={(e) => { e.preventDefault(); onStatusChange(job.id, 'cancelled') }}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--dash-red)]/50 text-[var(--dash-red)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider hover:bg-[var(--dash-red)]/10 transition-colors"
              >
                Cancel Booking
              </button>
              <button
                onClick={handleNoShow}
                disabled={markingNoShow}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--dash-amber)]/50 text-[var(--dash-amber)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider hover:bg-[var(--dash-amber)]/10 transition-colors disabled:opacity-60"
              >
                {markingNoShow ? 'Processing...' : 'Mark No-Show'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
