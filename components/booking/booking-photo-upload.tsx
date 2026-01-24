'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Image as ImageIcon, Camera, Sparkles, Loader2 } from 'lucide-react'
import { uploadBookingPhoto, deleteBookingPhoto } from '@/lib/actions/booking-photos'
import { toast } from 'sonner'
import Image from 'next/image'
import type { BookingPhoto, AIPhotoAnalysis } from '@/types/booking-photos'
import { getConditionLabel, getIssueLabel } from '@/types/booking-photos'
import { resizeImage, selectBestPhotosForAnalysis } from '@/lib/utils/image-resize'

const MAX_PHOTOS_PER_TYPE = 5
const MAX_AI_ANALYSIS_PHOTOS = 3

interface BookingPhotoUploadProps {
  leadId: string
  businessId: string
  initialPhotos?: BookingPhoto[]
  onPhotosChange?: (photos: BookingPhoto[]) => void
  readOnly?: boolean
}

export function BookingPhotoUpload({
  leadId,
  businessId,
  initialPhotos = [],
  onPhotosChange,
  readOnly = false
}: BookingPhotoUploadProps) {
  const [photos, setPhotos] = useState<BookingPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState<'exterior' | 'interior' | 'problem_area' | 'other'>('exterior')
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
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

    // Check upload limit for this photo type
    const photosOfType = photos.filter(p => p.photo_type === photoType)
    if (photosOfType.length >= MAX_PHOTOS_PER_TYPE) {
      toast.error(`Maximum ${MAX_PHOTOS_PER_TYPE} ${photoType.replace('_', ' ')} photos allowed`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    try {
      // Resize image before upload (768px max dimension for good quality)
      let fileToUpload = file
      try {
        fileToUpload = await resizeImage(file, 768, 0.85)
      } catch (resizeError) {
        console.warn('Failed to resize image, uploading original:', resizeError)
        // Fallback to original file if resize fails
        fileToUpload = file
      }
      
      const newPhoto = await uploadBookingPhoto(leadId, businessId, fileToUpload, photoType)
      const updatedPhotos = [newPhoto, ...photos]
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
      toast.success('Photo uploaded successfully')
      
      // Don't analyze immediately - let the batch analysis handle it
      // This prevents analyzing every photo and only analyzes the best 2-3
      
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

  async function analyzePhoto(photoId: string, photoUrl: string) {
    // Check if already processed to avoid duplicates
    const photo = photos.find(p => p.id === photoId)
    if (photo?.ai_processed) {
      toast.info('Photo already analyzed')
      return
    }
    
    setAnalyzing(prev => new Set(prev).add(photoId))
    
    try {
      const response = await fetch('/api/analyze-booking-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          photoId, 
          photoUrl,
          photoType: photo?.photo_type || photoType,
          // vehicleType can be passed from parent component if available
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 409) {
          // Duplicate detected
          toast.info('Photo already analyzed')
          return
        }
        
        // Provide user-friendly error messages
        let errorMessage = errorData.error || 'Failed to analyze photo'
        if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
          errorMessage = 'AI analysis is temporarily unavailable. Please try again later or contact support.'
        }
        
        // Show toast and return instead of throwing
        toast.error(errorMessage)
        return
      }

      const data = await response.json()
      
      // Update photo with analysis
      setPhotos(prev => prev.map(p => 
        p.id === photoId 
          ? { ...p, ai_analysis: data.analysis, ai_processed: true, ai_processed_at: new Date().toISOString() }
          : p
      ))
      
      onPhotosChange?.(photos.map(p => 
        p.id === photoId 
          ? { ...p, ai_analysis: data.analysis, ai_processed: true, ai_processed_at: new Date().toISOString() }
          : p
      ))
      
      toast.success('Photo analyzed successfully')
    } catch (error: any) {
      console.error('Analysis error:', error)
      // Only show toast if error wasn't already handled
      if (error.message && !error.message.includes('temporarily unavailable')) {
        toast.error(error.message || 'Failed to analyze photo')
      }
    } finally {
      setAnalyzing(prev => {
        const next = new Set(prev)
        next.delete(photoId)
        return next
      })
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      await deleteBookingPhoto(photoId)
      const updated = photos.filter(p => p.id !== photoId)
      setPhotos(updated)
      onPhotosChange?.(updated)
      toast.success('Photo deleted successfully')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete photo')
    }
  }

  const PhotoCard = ({ photo }: { photo: BookingPhoto }) => {
    const isAnalyzing = analyzing.has(photo.id)
    const hasAnalysis = photo.ai_analysis && photo.ai_processed
    const isSelectedForAnalysis = selectedForAnalysis.has(photo.id) && !hasAnalysis

    return (
      <div className="relative group border rounded-lg overflow-hidden bg-muted">
        <div className="aspect-square relative">
          <Image
            src={photo.storage_url}
            alt={`${photo.photo_type} photo`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
          
          {/* Selected for AI Analysis Badge */}
          {isSelectedForAnalysis && !isAnalyzing && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-blue-600 hover:bg-blue-700">
                <Sparkles className="h-3 w-3 mr-1" />
                Selected for AI
              </Badge>
            </div>
          )}
          
          {/* AI Analysis Badge */}
          {hasAnalysis && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Analyzed
              </Badge>
            </div>
          )}
          
          {/* Analyzing Indicator */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Analyzing...</p>
              </div>
            </div>
          )}

          {/* Delete Button */}
          {!readOnly && (
            <button
              onClick={() => handleDelete(photo.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* AI Analysis Results */}
        {hasAnalysis && photo.ai_analysis && (
          <div className="p-4 bg-card border-t space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">Condition:</span>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {getConditionLabel(photo.ai_analysis.condition_assessment)}
              </Badge>
            </div>
            
            {photo.ai_analysis.detected_issues.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground block">Issues:</span>
                <div className="flex flex-wrap gap-2">
                  {photo.ai_analysis.detected_issues.slice(0, 3).map((issue, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                      {getIssueLabel(issue)}
                    </Badge>
                  ))}
                  {photo.ai_analysis.detected_issues.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{photo.ai_analysis.detected_issues.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {photo.ai_analysis.vehicle_size_detected && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Size:</span>
                <Badge variant="outline" className="text-xs px-2 py-1 capitalize">
                  {photo.ai_analysis.vehicle_size_detected}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Track which photos are selected for AI analysis
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<Set<string>>(new Set())

  // Auto-analyze best photos when user finishes uploading
  useEffect(() => {
    if (photos.length > 0 && !readOnly && !uploading) {
      // Wait a bit for all uploads to complete
      const timer = setTimeout(() => {
        const currentlyAnalyzing = Array.from(analyzing)
        const unprocessedPhotos = photos.filter(
          p => !p.ai_processed && !currentlyAnalyzing.includes(p.id)
        )
        
        if (unprocessedPhotos.length > 0) {
          // Select best photos for analysis
          const bestPhotoIds = selectBestPhotosForAnalysis(
            unprocessedPhotos.map(p => ({
              id: p.id,
              width: 1000, // Approximate - could be improved
              height: 1000,
              fileSize: p.file_size || 500000
            }))
          )
          
          // Update selected photos indicator
          setSelectedForAnalysis(new Set(bestPhotoIds.slice(0, MAX_AI_ANALYSIS_PHOTOS)))
          
          // Analyze only the best photos (max 3)
          const photosToAnalyze = unprocessedPhotos
            .filter(p => bestPhotoIds.includes(p.id))
            .slice(0, MAX_AI_ANALYSIS_PHOTOS)
          
          photosToAnalyze.forEach(photo => {
            if (!photo.ai_processed && !currentlyAnalyzing.includes(photo.id)) {
              analyzePhoto(photo.id, photo.storage_url)
            }
          })
        }
      }, 2000) // Wait 2 seconds after last upload
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, readOnly, uploading])

  const groupedPhotos = {
    exterior: photos.filter(p => p.photo_type === 'exterior'),
    interior: photos.filter(p => p.photo_type === 'interior'),
    problem_area: photos.filter(p => p.photo_type === 'problem_area'),
    other: photos.filter(p => p.photo_type === 'other')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Vehicle Photos
          {photos.length > 0 && (
            <Badge variant="secondary">{photos.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Upload photos of your vehicle to help us provide accurate pricing.
          <br />
          <span className="text-xs text-muted-foreground mt-1 block">
            Maximum {MAX_PHOTOS_PER_TYPE} photos per type. AI will automatically analyze the best {MAX_AI_ANALYSIS_PHOTOS} photos.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Controls */}
        {!readOnly && (
          <div>
            <div className="flex gap-2 mb-3">
              <Button
                variant={photoType === 'exterior' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('exterior')}
              >
                Exterior
              </Button>
              <Button
                variant={photoType === 'interior' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('interior')}
              >
                Interior
              </Button>
              <Button
                variant={photoType === 'problem_area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('problem_area')}
              >
                Problem Area
              </Button>
              <Button
                variant={photoType === 'other' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhotoType('other')}
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
              <Button
                asChild
                variant="outline"
                disabled={uploading || photos.filter(p => p.photo_type === photoType).length >= MAX_PHOTOS_PER_TYPE}
                className="w-full"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading 
                    ? 'Uploading...' 
                    : photos.filter(p => p.photo_type === photoType).length >= MAX_PHOTOS_PER_TYPE
                      ? `Maximum ${MAX_PHOTOS_PER_TYPE} ${photoType.replace('_', ' ')} photos`
                      : `Upload ${photoType.replace('_', ' ')} Photo (${photos.filter(p => p.photo_type === photoType).length}/${MAX_PHOTOS_PER_TYPE})`
                  }
                </span>
              </Button>
            </label>
            {photos.filter(p => p.photo_type === photoType).length >= MAX_PHOTOS_PER_TYPE && (
              <p className="text-xs text-muted-foreground mt-1">
                Maximum {MAX_PHOTOS_PER_TYPE} photos per type. AI will analyze the best {MAX_AI_ANALYSIS_PHOTOS} photos.
              </p>
            )}
          </div>
        )}

        {/* Photo Grids by Type */}
        {groupedPhotos.exterior.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Exterior Photos ({groupedPhotos.exterior.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupedPhotos.exterior.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        )}

        {groupedPhotos.interior.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Interior Photos ({groupedPhotos.interior.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupedPhotos.interior.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        )}

        {groupedPhotos.problem_area.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Problem Areas ({groupedPhotos.problem_area.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupedPhotos.problem_area.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        )}

        {groupedPhotos.other.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Other Photos ({groupedPhotos.other.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupedPhotos.other.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-1">No photos uploaded yet</p>
            <p className="text-sm">
              {readOnly 
                ? 'Photos will appear here once uploaded'
                : 'Upload photos to help us provide accurate pricing and service recommendations'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
