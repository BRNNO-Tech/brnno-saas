'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, User, Briefcase, Sparkles, Image as ImageIcon, ExternalLink, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CustomerDashboardPhoto, WorkerDashboardPhoto } from '@/lib/actions/dashboard-photos'

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

type DashboardPhoto = CustomerDashboardPhoto | WorkerDashboardPhoto

interface DashboardPhotosWidgetProps {
  customerPhotos: CustomerDashboardPhoto[]
  workerPhotos: WorkerDashboardPhoto[]
  totalCount: number
  /** Max number of photos to show in the grid (default 12 for dashboard teaser) */
  maxDisplay?: number
  /** Show "View all photos" link in header (default true; set false on the full Photos page) */
  showViewAllLink?: boolean
}

export function DashboardPhotosWidget({
  customerPhotos,
  workerPhotos,
  totalCount,
  maxDisplay = 12,
  showViewAllLink = true
}: DashboardPhotosWidgetProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'customer' | 'worker'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const PhotoCard = ({ photo }: { photo: DashboardPhoto }) => {
    const isCustomerPhoto = photo.source === 'customer'
    const hasAIAnalysis = photo.ai_processed && photo.ai_analysis

    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <div className="aspect-square rounded overflow-hidden border border-[var(--dash-border)] bg-[var(--dash-surface)] hover:border-[var(--dash-amber)]/50 transition-colors">
              <Image
                src={photo.storage_url}
                alt={`${photo.source} photo`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <span className="absolute top-2 left-2 font-dash-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-[var(--dash-border-bright)] bg-[var(--dash-graphite)] text-[var(--dash-text-dim)] flex items-center gap-1">
                {isCustomerPhoto ? <User className="h-2.5 w-2.5" /> : <Briefcase className="h-2.5 w-2.5" />}
                {isCustomerPhoto ? 'Customer' : 'Worker'}
              </span>
              {hasAIAnalysis && (
                <span className="absolute top-2 right-2 font-dash-mono text-[9px] px-1.5 py-0.5 border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)] flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              )}
              {isCustomerPhoto && !hasAIAnalysis && (
                <span className="absolute top-2 right-2 font-dash-mono text-[9px] px-1.5 py-0.5 border border-[var(--dash-border-bright)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)] flex items-center gap-1">
                  <ImageIcon className="h-2.5 w-2.5" /> Not Analyzed
                </span>
              )}
              <span className="absolute bottom-2 left-2 font-dash-mono text-[9px] text-[var(--dash-text-muted)]">
                {photo.photo_type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-4xl">
          <div className="space-y-4">
            {/* Full Size Image */}
            <div className="relative aspect-video w-full">
              <Image
                src={photo.storage_url}
                alt={`${photo.source} photo`}
                fill
                className="object-contain"
              />
            </div>

            {/* Photo Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isCustomerPhoto ? 'default' : 'secondary'}>
                    {isCustomerPhoto ? 'Customer Upload' : 'Worker Upload'}
                  </Badge>
                  {photo.job_title && (
                    <Link href={`/dashboard/jobs/${photo.job_id}`}>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        {photo.job_title}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(photo.uploaded_at).toLocaleDateString()}
                </span>
              </div>

              {/* AI Analysis */}
              {hasAIAnalysis && photo.ai_analysis ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      AI Analysis
                    </span>
                  </div>

                  {photo.ai_analysis.condition_assessment && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Condition:</p>
                      <Badge>{photo.ai_analysis.condition_assessment.replace('_', ' ')}</Badge>
                    </div>
                  )}

                  {photo.ai_analysis.detected_issues && photo.ai_analysis.detected_issues.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {photo.ai_analysis.detected_issues.map((issue: string, idx: number) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {issue.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {photo.ai_analysis.reasoning && (
                    <p className="text-sm text-muted-foreground italic">
                      "{photo.ai_analysis.reasoning}"
                    </p>
                  )}
                </div>
              ) : isCustomerPhoto ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg border border-zinc-200 dark:border-zinc-900">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      This photo was not selected for AI analysis. Only the best 2-3 photos are analyzed to optimize costs.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const allPhotos = [
    ...customerPhotos.map(p => ({ ...p, sortKey: new Date(p.uploaded_at).getTime() })),
    ...workerPhotos.map(p => ({ ...p, sortKey: new Date(p.uploaded_at).getTime() }))
  ].sort((a, b) => b.sortKey - a.sortKey).slice(0, maxDisplay)

  return (
    <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--dash-border)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 flex items-center justify-center border border-[var(--dash-amber)]/40 bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <span className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">
              Recent Photos
            </span>
            {totalCount > 0 && (
              <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] ml-2 border border-[var(--dash-border)] bg-[var(--dash-surface)] px-1.5 py-0.5">
                {totalCount}
              </span>
            )}
            <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">
              Customer uploads and worker photos from all jobs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showViewAllLink && (
            <Link
              href="/dashboard/photos"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
            >
              View all photos
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-text-dim)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)] transition-colors"
          >
            View All Jobs
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        {!mounted ? (
          <>
            <div className="grid grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] mb-4">
              <button className="bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-amber)] border-b-2 border-[var(--dash-amber)]">
                All ({allPhotos.length})
              </button>
              <button className="bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                Customer ({customerPhotos.length})
              </button>
              <button className="bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                Worker ({workerPhotos.length})
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allPhotos.slice(0, maxDisplay).map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </>
        ) : (
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] p-0 h-auto">
              <TabsTrigger
                value="all"
                className={cn(
                  'rounded-none border-0 border-b-2 bg-[var(--dash-graphite)] font-dash-mono text-[11px] text-[var(--dash-text-muted)] data-[state=active]:bg-[var(--dash-graphite)] data-[state=active]:text-[var(--dash-amber)] data-[state=active]:border-[var(--dash-amber)]'
                )}
              >
                All ({allPhotos.length})
              </TabsTrigger>
              <TabsTrigger
                value="customer"
                className={cn(
                  'rounded-none border-0 border-b-2 border-transparent bg-[var(--dash-graphite)] font-dash-mono text-[11px] text-[var(--dash-text-muted)] data-[state=active]:bg-[var(--dash-graphite)] data-[state=active]:text-[var(--dash-amber)] data-[state=active]:border-[var(--dash-amber)]'
                )}
              >
                Customer ({customerPhotos.length})
              </TabsTrigger>
              <TabsTrigger
                value="worker"
                className={cn(
                  'rounded-none border-0 border-b-2 border-transparent bg-[var(--dash-graphite)] font-dash-mono text-[11px] text-[var(--dash-text-muted)] data-[state=active]:bg-[var(--dash-graphite)] data-[state=active]:text-[var(--dash-amber)] data-[state=active]:border-[var(--dash-amber)]'
                )}
              >
                Worker ({workerPhotos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allPhotos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[var(--dash-text-muted)] opacity-50" />
                  <p className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No photos yet</p>
                  <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Photos will appear here once uploaded</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="customer" className="mt-4">
              {customerPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {customerPhotos.slice(0, maxDisplay).map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 text-[var(--dash-text-muted)] opacity-50" />
                  <p className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No customer photos</p>
                  <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Customer uploads during booking will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="worker" className="mt-4">
              {workerPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {workerPhotos.slice(0, maxDisplay).map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-[var(--dash-text-muted)] opacity-50" />
                  <p className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No worker photos</p>
                  <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Photos uploaded by workers will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
