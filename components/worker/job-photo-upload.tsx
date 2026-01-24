'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react'
import { uploadJobPhoto, deleteJobPhoto } from '@/lib/actions/job-photos'
import Image from 'next/image'

type Photo = {
  id: string
  photo_type: 'before' | 'after' | 'other'
  storage_url: string
  description?: string | null
  uploaded_at: string
}

export default function JobPhotoUpload({
  assignmentId,
  jobId,
  initialPhotos = [],
  readOnly = false
}: {
  assignmentId: string
  jobId: string
  initialPhotos?: Photo[]
  readOnly?: boolean
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'other'>('before')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const newPhoto = await uploadJobPhoto(jobId, file, photoType, { assignmentId })
      setPhotos([newPhoto, ...photos])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      await deleteJobPhoto(photoId)
      setPhotos(photos.filter(p => p.id !== photoId))
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error.message || 'Failed to delete photo')
    }
  }

  const beforePhotos = photos.filter(p => p.photo_type === 'before')
  const afterPhotos = photos.filter(p => p.photo_type === 'after')
  const otherPhotos = photos.filter(p => p.photo_type === 'other')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Job Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Controls */}
        {!readOnly && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
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
                  className="w-full sm:w-auto"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : `Upload ${photoType} Photo`}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* Before Photos */}
        {beforePhotos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">
              Before Photos ({beforePhotos.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {beforePhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={photo.storage_url}
                      alt="Before photo"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* After Photos */}
        {afterPhotos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">
              After Photos ({afterPhotos.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {afterPhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={photo.storage_url}
                      alt="After photo"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Photos */}
        {otherPhotos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">
              Other Photos ({otherPhotos.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {otherPhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={photo.storage_url}
                      alt="Other photo"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No photos uploaded yet</p>
            <p className="text-sm mt-1">Upload before/after photos to document your work</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

