'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  Star, 
  Sparkles, 
  Upload,
  Clock,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { uploadJobPhoto, type JobPhoto } from '@/lib/actions/job-photos'
import type { BookingPhoto, DetectedIssue } from '@/types/booking-photos'
import { getIssueLabel } from '@/types/booking-photos'

interface UnifiedJobPhotoGalleryProps {
  jobId: string
  bookingPhotos: BookingPhoto[]
  jobPhotos: JobPhoto[]
  readOnly?: boolean
  onUpload?: () => void
}

export function UnifiedJobPhotoGallery({
  jobId,
  bookingPhotos,
  jobPhotos,
  readOnly = false,
  onUpload
}: UnifiedJobPhotoGalleryProps) {
  const router = useRouter()
  const [selectedView, setSelectedView] = useState<'all' | 'booking' | 'job'>('all')
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'other'>('before')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localJobPhotos, setLocalJobPhotos] = useState<JobPhoto[]>(jobPhotos)

  // Check if we have AI analysis from booking
  const hasAIAnalysis = bookingPhotos.some(p => p.ai_processed && p.ai_analysis)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const newPhoto = await uploadJobPhoto(jobId, file, photoType)
      setLocalJobPhotos([newPhoto, ...localJobPhotos])
      toast.success('Photo uploaded successfully')
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh the page to show new photo
      router.refresh()
      
      if (onUpload) {
        onUpload()
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  // Use local state for job photos
  const totalPhotos = bookingPhotos.length + localJobPhotos.length
  const beforePhotos = [
    ...bookingPhotos, // All booking photos are "before"
    ...localJobPhotos.filter(p => p.photo_type === 'before')
  ]
  const afterPhotos = localJobPhotos.filter(p => p.photo_type === 'after')
  const otherPhotos = localJobPhotos.filter(p => p.photo_type === 'other')

  const PhotoCard = ({ 
    photo, 
    source 
  }: { 
    photo: BookingPhoto | JobPhoto
    source: 'booking' | 'job' 
  }) => {
    const isBookingPhoto = 'lead_id' in photo
    const aiAnalysis = isBookingPhoto ? (photo as BookingPhoto).ai_analysis : null

    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all">
              <Image
                src={photo.storage_url}
                alt={isBookingPhoto ? 'Booking photo' : 'Job photo'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Source Badge */}
              <Badge 
                className="absolute top-2 left-2"
                variant={source === 'booking' ? 'default' : 'secondary'}
              >
                {source === 'booking' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Booking
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3 mr-1" />
                    Job
                  </>
                )}
              </Badge>

              {/* AI Badge - Only show if analyzed */}
              {isBookingPhoto && (photo as BookingPhoto).ai_processed && aiAnalysis && (
                <Badge className="absolute top-2 right-2 bg-purple-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Analyzed
                </Badge>
              )}
              
              {/* Not Analyzed Badge - Show if booking photo but not analyzed */}
              {isBookingPhoto && !(photo as BookingPhoto).ai_processed && (
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
                alt={isBookingPhoto ? 'Booking photo' : 'Job photo'}
                fill
                className="object-contain"
              />
            </div>

            {/* Photo Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={source === 'booking' ? 'default' : 'secondary'}>
                  {source === 'booking' ? 'Customer Upload (Booking)' : 'Job Photo'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(photo.uploaded_at).toLocaleDateString()}
                </span>
              </div>

              {/* AI Analysis (Booking Photos Only) */}
              {isBookingPhoto && aiAnalysis ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      AI Analysis
                    </span>
                  </div>

                  {aiAnalysis.condition_assessment && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Condition:</p>
                      <Badge>{aiAnalysis.condition_assessment.replace('_', ' ')}</Badge>
                    </div>
                  )}

                  {aiAnalysis.detected_issues && aiAnalysis.detected_issues.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.detected_issues.map((issue: DetectedIssue, idx: number) => (
                          <Badge key={idx} variant="destructive">
                            {getIssueLabel(issue)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.reasoning && (
                    <p className="text-sm text-muted-foreground italic">
                      "{aiAnalysis.reasoning}"
                    </p>
                  )}
                </div>
              ) : isBookingPhoto && !(photo as BookingPhoto).ai_processed ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg border border-zinc-200 dark:border-zinc-900">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">
                      This photo was not selected for AI analysis. Only the best 2-3 photos are analyzed to optimize costs.
                    </span>
                  </div>
                </div>
              ) : null}

              {'description' in photo && photo.description && (
                <p className="text-sm text-muted-foreground">{photo.description}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos
            {totalPhotos > 0 && (
              <Badge variant="secondary">{totalPhotos}</Badge>
            )}
          </CardTitle>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={photoType === 'before' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('before')}
                  disabled={uploading}
                >
                  Before
                </Button>
                <Button
                  variant={photoType === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('after')}
                  disabled={uploading}
                >
                  After
                </Button>
                <Button
                  variant={photoType === 'other' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('other')}
                  disabled={uploading}
                >
                  Other
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <label htmlFor="photo-upload">
                <Button asChild size="sm" disabled={uploading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Analysis Summary (if booking photos exist) */}
        {hasAIAnalysis && bookingPhotos.length > 0 && (
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Customer uploaded {bookingPhotos.length} photos during booking
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    AI analysis was used to determine condition and suggest services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({totalPhotos})
            </TabsTrigger>
            <TabsTrigger value="booking">
              Booking ({bookingPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="job">
              Job ({localJobPhotos.length})
            </TabsTrigger>
          </TabsList>

          {/* All Photos */}
          <TabsContent value="all" className="space-y-6">
            {/* Before Photos */}
            {beforePhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Before ({beforePhotos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {beforePhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      source={'lead_id' in photo ? 'booking' : 'job'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* After Photos */}
            {afterPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  After ({afterPhotos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {afterPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      source="job"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Photos */}
            {otherPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Other ({otherPhotos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {otherPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      source="job"
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Booking Photos Only */}
          <TabsContent value="booking">
            {bookingPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {bookingPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    source="booking"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No booking photos</p>
                <p className="text-sm mt-1">
                  Customer didn't upload photos during booking
                </p>
              </div>
            )}
          </TabsContent>

          {/* Job Photos Only */}
          <TabsContent value="job">
            {localJobPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {localJobPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    source="job"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No job photos uploaded yet</p>
                <p className="text-sm mt-1">
                  {readOnly 
                    ? 'Photos will appear here once uploaded'
                    : 'Upload photos during or after completing the job'
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {totalPhotos === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-1">No photos yet</p>
            <p className="text-sm">
              Photos will appear here once uploaded
            </p>
          </div>
        )}

        {/* Timeline View (Optional - can add later) */}
        {totalPhotos > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {bookingPhotos.length > 0 && 'Customer uploaded photos during booking • '}
                {localJobPhotos.length > 0 && `${localJobPhotos.length} photos added during job`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
