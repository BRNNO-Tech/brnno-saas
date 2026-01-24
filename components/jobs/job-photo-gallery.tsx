'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Image as ImageIcon, Camera, Star, Sparkles } from 'lucide-react'
import { uploadJobPhoto, deleteJobPhoto, updateJobPhoto } from '@/lib/actions/job-photos'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

interface JobPhoto {
  id: string
  photo_type: 'before' | 'after' | 'other'
  storage_url: string
  description?: string | null
  ai_tags?: string[]
  ai_detected_issues?: string[]
  ai_suggested_services?: string[]
  ai_generated_caption?: string
  is_featured: boolean
  uploaded_at: string
}

interface JobPhotoGalleryProps {
  jobId: string
  initialPhotos: JobPhoto[]
  readOnly?: boolean
}

export function JobPhotoGallery({ 
  jobId, 
  initialPhotos, 
  readOnly = false 
}: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'other'>('before')
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setPhotos([newPhoto, ...photos])
      toast.success('Photo uploaded successfully')
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      await deleteJobPhoto(photoId)
      setPhotos(photos.filter(p => p.id !== photoId))
      toast.success('Photo deleted successfully')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete photo')
    }
  }

  async function handleToggleFeatured(photoId: string, isFeatured: boolean) {
    try {
      await updateJobPhoto(photoId, { is_featured: !isFeatured })
      setPhotos(photos.map(p => 
        p.id === photoId ? { ...p, is_featured: !isFeatured } : p
      ))
      toast.success(!isFeatured ? 'Marked as featured' : 'Removed from featured')
    } catch (error: any) {
      toast.error('Failed to update photo')
    }
  }

  const beforePhotos = photos.filter(p => p.photo_type === 'before')
  const afterPhotos = photos.filter(p => p.photo_type === 'after')
  const otherPhotos = photos.filter(p => p.photo_type === 'other')

  const PhotoGrid = ({ photos, label }: { photos: JobPhoto[], label: string }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label} ({photos.length})
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <Image
                    src={photo.storage_url}
                    alt={`${label} photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {photo.is_featured && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  {photo.ai_tags && photo.ai_tags.length > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <div className="space-y-4">
                  <div className="relative aspect-video w-full">
                    <Image
                      src={photo.storage_url}
                      alt={`${label} photo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  {/* AI Analysis Results */}
                  {photo.ai_detected_issues && photo.ai_detected_issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">AI Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {photo.ai_detected_issues.map((issue, idx) => (
                          <Badge key={idx} variant="destructive">
                            {issue.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {photo.ai_suggested_services && photo.ai_suggested_services.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Suggested Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {photo.ai_suggested_services.map((service, idx) => (
                          <Badge key={idx} variant="secondary">
                            {service.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {photo.ai_generated_caption && (
                    <div>
                      <p className="text-sm font-semibold mb-1">AI Caption:</p>
                      <p className="text-sm text-muted-foreground italic">
                        {photo.ai_generated_caption}
                      </p>
                    </div>
                  )}
                  
                  {photo.description && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">
                        {photo.description}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {!readOnly && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleToggleFeatured(photo.id, photo.is_featured)}
                  className="bg-white dark:bg-zinc-800 text-amber-500 rounded-full p-1.5 shadow-lg"
                  title={photo.is_featured ? 'Remove from featured' : 'Mark as featured'}
                >
                  <Star className={`h-4 w-4 ${photo.is_featured ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="bg-white dark:bg-zinc-800 text-red-500 rounded-full p-1.5 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Job Photos
            {photos.length > 0 && (
              <Badge variant="secondary">{photos.length}</Badge>
            )}
          </CardTitle>
          {!readOnly && (
            <div className="flex gap-2">
              <Button
                variant={photoType === 'before' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('before')}
              >
                Before
              </Button>
              <Button
                variant={photoType === 'after' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('after')}
              >
                After
              </Button>
              <Button
                variant={photoType === 'other' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('other')}
              >
                Other
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Controls */}
        {!readOnly && (
          <div>
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
              <Button
                asChild
                variant="outline"
                disabled={uploading}
                className="w-full"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : `Upload ${photoType} Photo`}
                </span>
              </Button>
            </label>
          </div>
        )}

        {/* Before Photos */}
        {beforePhotos.length > 0 && (
          <PhotoGrid photos={beforePhotos} label="Before Photos" />
        )}

        {/* After Photos */}
        {afterPhotos.length > 0 && (
          <PhotoGrid photos={afterPhotos} label="After Photos" />
        )}

        {/* Other Photos */}
        {otherPhotos.length > 0 && (
          <PhotoGrid photos={otherPhotos} label="Other Photos" />
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-1">No photos uploaded yet</p>
            <p className="text-sm">
              {readOnly 
                ? 'Photos will appear here once uploaded'
                : 'Upload before/after photos to document your work'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
