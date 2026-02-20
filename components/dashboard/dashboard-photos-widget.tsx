'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, User, Briefcase, Sparkles, Image as ImageIcon, ExternalLink, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CustomerDashboardPhoto, WorkerDashboardPhoto } from '@/lib/actions/dashboard-photos'

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
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all">
              <Image
                src={photo.storage_url}
                alt={`${photo.source} photo`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Source Badge */}
              <Badge 
                className="absolute top-2 left-2"
                variant={isCustomerPhoto ? 'default' : 'secondary'}
              >
                {isCustomerPhoto ? (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Customer
                  </>
                ) : (
                  <>
                    <Briefcase className="h-3 w-3 mr-1" />
                    Worker
                  </>
                )}
              </Badge>

              {/* AI Badge - Only show if analyzed */}
              {hasAIAnalysis && (
                <Badge className="absolute top-2 right-2 bg-purple-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Analyzed
                </Badge>
              )}
              
              {/* Not Analyzed Badge - Show if customer photo but not analyzed */}
              {isCustomerPhoto && !hasAIAnalysis && (
                <Badge className="absolute top-2 right-2 bg-zinc-500/70">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Not Analyzed
                </Badge>
              )}

              {/* Photo Type */}
              <Badge className="absolute bottom-2 left-2 text-xs">
                {photo.photo_type.replace('_', ' ')}
              </Badge>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Recent Photos
              {totalCount > 0 && (
                <Badge variant="secondary">{totalCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Customer uploads and worker photos from all jobs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showViewAllLink && (
              <Link href="/dashboard/photos">
                <Button variant="outline" size="sm">
                  View all photos
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/dashboard/jobs">
              <Button variant="outline" size="sm">
                View All Jobs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!mounted ? (
          // Render static content during SSR to avoid hydration mismatch
          <>
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 grid w-full grid-cols-3 mb-4">
              <button className="inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50">
                All ({allPhotos.length})
              </button>
              <button className="inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                Customer ({customerPhotos.length})
              </button>
              <button className="inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({allPhotos.length})
              </TabsTrigger>
              <TabsTrigger value="customer">
                Customer ({customerPhotos.length})
              </TabsTrigger>
              <TabsTrigger value="worker">
                Worker ({workerPhotos.length})
              </TabsTrigger>
            </TabsList>

            {/* All Photos */}
            <TabsContent value="all" className="mt-4">
              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allPhotos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No photos yet</p>
                  <p className="text-sm">Photos will appear here once uploaded</p>
                </div>
              )}
            </TabsContent>

            {/* Customer Photos */}
            <TabsContent value="customer" className="mt-4">
              {customerPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {customerPhotos.slice(0, maxDisplay).map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No customer photos</p>
                  <p className="text-sm">Customer uploads during booking will appear here</p>
                </div>
              )}
            </TabsContent>

            {/* Worker Photos */}
            <TabsContent value="worker" className="mt-4">
              {workerPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {workerPhotos.slice(0, maxDisplay).map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No worker photos</p>
                  <p className="text-sm">Photos uploaded by workers will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
