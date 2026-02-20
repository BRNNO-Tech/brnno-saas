export const dynamic = 'force-dynamic'

import { getRecentPhotos } from '@/lib/actions/dashboard-photos'
import { DashboardPhotosWidget } from '@/components/dashboard/dashboard-photos-widget'
import { GlowBG } from '@/components/ui/glow-bg'

export default async function PhotosPage() {
  const photos = await getRecentPhotos(100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Photos
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
              Customer uploads and worker photos from all jobs
            </p>
          </div>
          <DashboardPhotosWidget
            customerPhotos={photos.customerPhotos}
            workerPhotos={photos.workerPhotos}
            totalCount={photos.totalCount}
            maxDisplay={100}
            showViewAllLink={false}
          />
        </div>
      </div>
    </div>
  )
}
