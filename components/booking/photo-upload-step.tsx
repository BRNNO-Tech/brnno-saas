'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Camera, 
  X, 
  CheckCircle, 
  Loader2,
  Sparkles,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { VehicleCondition, DetectedIssue } from '@/types/booking-photos'
import { getConditionLabel, getIssueLabel } from '@/types/booking-photos'

interface PhotoUploadStepProps {
  leadId: string
  businessId: string
  vehicleType?: string
  onAnalysisComplete: (results: {
    condition: VehicleCondition
    detectedIssues: DetectedIssue[]
    confidence: number
    vehicleSize?: string
  }) => void
  onBack: () => void
}

interface UploadedPhoto {
  id?: string
  file: File
  preview: string
  type: 'exterior' | 'interior' | 'problem_area'
  uploaded: boolean
}

export function PhotoUploadStep({
  leadId,
  businessId,
  vehicleType,
  onAnalysisComplete,
  onBack
}: PhotoUploadStepProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'exterior' | 'interior' | 'problem_area'
  ) {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select image files only')
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        continue
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      
      setPhotos(prev => [...prev, {
        file,
        preview,
        type,
        uploaded: false
      }])
    }

    // Reset file input
    if (e.target) {
      e.target.value = ''
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const newPhotos = [...prev]
      URL.revokeObjectURL(newPhotos[index].preview)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  async function handleContinue() {
    if (photos.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }

    setUploading(true)
    try {
      // Upload all photos
      const uploadedPhotos = await Promise.all(
        photos.map(async (photo) => {
          const formData = new FormData()
          formData.append('file', photo.file)
          formData.append('leadId', leadId)
          formData.append('businessId', businessId)
          formData.append('photoType', photo.type)

          const response = await fetch('/api/booking/upload-photo', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${photo.file.name}`)
          }

          const data = await response.json()
          return data.photo
        })
      )

      toast.success('Photos uploaded successfully')
      
      // Mark photos as uploaded
      setPhotos(prev => prev.map(p => ({ ...p, uploaded: true })))

      // Analyze photos with AI
      setAnalyzing(true)
      const analysisResponse = await fetch('/api/booking/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          vehicleType
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze photos')
      }

      const analysis = await analysisResponse.json()
      setAnalysisResults(analysis)
      
      toast.success('AI analysis complete!')

      // Pass results to parent
      onAnalysisComplete({
        condition: analysis.overall_condition,
        detectedIssues: analysis.primary_issues,
        confidence: analysis.confidence,
        vehicleSize: analysis.vehicle_size_detected
      })

    } catch (error: any) {
      console.error('Upload/Analysis error:', error)
      toast.error(error.message || 'Failed to process photos')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const hasExterior = photos.some(p => p.type === 'exterior')
  const hasInterior = photos.some(p => p.type === 'interior')
  const canContinue = photos.length >= 2 && hasExterior && hasInterior

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Vehicle Photos</h2>
        <p className="text-muted-foreground">
          Help us provide an accurate quote by uploading photos of your vehicle. 
          Our AI will analyze the condition automatically.
        </p>
      </div>

      {/* Instructions */}
      {!analysisResults && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  For best results:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Take photos in good lighting</li>
                  <li>• Capture multiple angles of exterior</li>
                  <li>• Show interior front and back seats</li>
                  <li>• Include any problem areas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Buttons */}
      {!analysisResults && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => handleFileSelect(e, 'exterior')}
              className="hidden"
              id="exterior-upload"
            />
            <label htmlFor="exterior-upload">
              <Button
                asChild
                variant="outline"
                className="w-full h-24 flex-col gap-2"
                disabled={uploading || analyzing}
              >
                <span>
                  <Camera className="h-6 w-6" />
                  <span className="font-semibold">Exterior</span>
                  <span className="text-xs text-muted-foreground">Required</span>
                </span>
              </Button>
            </label>
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => handleFileSelect(e, 'interior')}
              className="hidden"
              id="interior-upload"
            />
            <label htmlFor="interior-upload">
              <Button
                asChild
                variant="outline"
                className="w-full h-24 flex-col gap-2"
                disabled={uploading || analyzing}
              >
                <span>
                  <Camera className="h-6 w-6" />
                  <span className="font-semibold">Interior</span>
                  <span className="text-xs text-muted-foreground">Required</span>
                </span>
              </Button>
            </label>
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => handleFileSelect(e, 'problem_area')}
              className="hidden"
              id="problem-upload"
            />
            <label htmlFor="problem-upload">
              <Button
                asChild
                variant="outline"
                className="w-full h-24 flex-col gap-2"
                disabled={uploading || analyzing}
              >
                <span>
                  <AlertCircle className="h-6 w-6" />
                  <span className="font-semibold">Problem Areas</span>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </span>
              </Button>
            </label>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && !analysisResults && (
        <div>
          <p className="text-sm font-semibold mb-3">
            Uploaded Photos ({photos.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={photo.preview}
                    alt={`${photo.type} photo`}
                    fill
                    className="object-cover"
                  />
                  {photo.uploaded && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                  <Badge className="absolute bottom-2 left-2 text-xs">
                    {photo.type.replace('_', ' ')}
                  </Badge>
                </div>
                {!uploading && !analyzing && (
                  <button
                    onClick={() => removePhoto(index)}
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

      {/* AI Analysis Results */}
      {analysisResults && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">AI Analysis Complete</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Detected Condition:</p>
                <Badge className="text-base px-3 py-1">
                  {getConditionLabel(analysisResults.overall_condition)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {Math.round(analysisResults.confidence * 100)}%
                </p>
              </div>

              {analysisResults.primary_issues.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Detected Issues:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.primary_issues.map((issue: DetectedIssue, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {getIssueLabel(issue)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Based on your photos, we've selected the appropriate service level and will suggest relevant add-ons.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={uploading || analyzing}
        >
          Back
        </Button>
        
        {!analysisResults ? (
          <Button
            onClick={handleContinue}
            disabled={!canContinue || uploading || analyzing}
            className="flex-1"
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {analyzing && <Sparkles className="mr-2 h-4 w-4 animate-pulse" />}
            {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Continue'}
          </Button>
        ) : (
          <Button
            onClick={() => onAnalysisComplete({
              condition: analysisResults.overall_condition,
              detectedIssues: analysisResults.primary_issues,
              confidence: analysisResults.confidence,
              vehicleSize: analysisResults.vehicle_size_detected
            })}
            className="flex-1"
          >
            Continue to Add-ons
          </Button>
        )}
      </div>

      {!canContinue && photos.length > 0 && !analysisResults && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
          Please upload at least one exterior and one interior photo to continue
        </p>
      )}
    </div>
  )
}
