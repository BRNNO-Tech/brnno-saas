export const dynamic = 'force-dynamic'

import { getRecentPhotos } from '@/lib/actions/dashboard-photos'
import { canAccessPhotos } from '@/lib/actions/permissions'
import { DashboardPhotosWidget } from '@/components/dashboard/dashboard-photos-widget'
import UpgradePrompt from '@/components/upgrade-prompt'

export default async function PhotosPage() {
  const canView = await canAccessPhotos()
  if (!canView) {
    return <UpgradePrompt moduleMode feature="Photos" />
  }
  const photos = await getRecentPhotos(100)
  const customerCount = photos.customerPhotos.length
  const workerCount = photos.workerPhotos.length

  return (
    <div className="w-full pb-20 md:pb-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
          Photos
        </h1>
        <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
          Customer uploads and worker photos from all jobs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] mb-6">
        <StatCard label="Total" value={photos.totalCount} accent="amber" />
        <StatCard label="Customer uploads" value={customerCount} />
        <StatCard label="Worker photos" value={workerCount} />
      </div>

      <DashboardPhotosWidget
        customerPhotos={photos.customerPhotos}
        workerPhotos={photos.workerPhotos}
        totalCount={photos.totalCount}
        maxDisplay={100}
        showViewAllLink={false}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'amber'
}) {
  const valueColor = accent === 'amber' ? 'text-[var(--dash-amber)]' : 'text-[var(--dash-text)]'
  const borderColor = accent === 'amber' ? 'border-b-[var(--dash-amber)]' : 'border-b-transparent'

  return (
    <div className={`bg-[var(--dash-graphite)] p-5 border-b-2 ${borderColor}`}>
      <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">
        {label}
      </div>
      <div className={`font-dash-condensed font-extrabold text-4xl leading-none tracking-tight ${valueColor}`}>
        {value}
      </div>
    </div>
  )
}
