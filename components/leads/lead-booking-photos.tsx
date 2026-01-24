'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Sparkles, AlertCircle, TrendingUp, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BookingPhoto, VehicleCondition, DetectedIssue } from '@/types/booking-photos'
import { getConditionLabel, getIssueLabel, getConditionMarkup } from '@/types/booking-photos'
import { Button } from '@/components/ui/button'
import { getAISuggestedAddons } from '@/lib/actions/booking-photos'
import { toast } from 'sonner'

interface LeadBookingPhotosProps {
  leadId: string
  businessId: string
  photos: BookingPhoto[]
  aiCondition?: VehicleCondition | null
  aiDetectedIssues?: DetectedIssue[] | null
  aiConfidenceScore?: number | null
  aiVehicleSize?: string | null
  aiAnalysisSummary?: any
  aiSuggestedAddons?: any[]
}

export function LeadBookingPhotos({
  leadId,
  businessId,
  photos,
  aiCondition,
  aiDetectedIssues,
  aiConfidenceScore,
  aiVehicleSize,
  aiAnalysisSummary,
  aiSuggestedAddons = []
}: LeadBookingPhotosProps) {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const hasPhotos = photos && photos.length > 0
  const hasAnalysis = aiCondition || (aiDetectedIssues && aiDetectedIssues.length > 0)

  async function handleLoadSuggestions() {
    if (aiSuggestedAddons && aiSuggestedAddons.length > 0) {
      return // Already loaded
    }

    setLoadingSuggestions(true)
    try {
      await getAISuggestedAddons(leadId, businessId)
      toast.success('Add-on suggestions loaded')
      // Refresh the page or update state
      window.location.reload()
    } catch (error: any) {
      toast.error('Failed to load suggestions')
      console.error(error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const groupedPhotos = {
    exterior: photos.filter(p => p.photo_type === 'exterior'),
    interior: photos.filter(p => p.photo_type === 'interior'),
    problem_area: photos.filter(p => p.photo_type === 'problem_area'),
    other: photos.filter(p => p.photo_type === 'other')
  }

  const PhotoCard = ({ photo }: { photo: BookingPhoto }) => {
    const hasAnalysis = photo.ai_analysis && photo.ai_processed

    return (
      <div className="relative group border rounded-lg overflow-hidden bg-muted">
        <Dialog>
          <DialogTrigger asChild>
            <div className="aspect-square relative cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              <Image
                src={photo.storage_url}
                alt={`${photo.photo_type} photo`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              
              {hasAnalysis && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-600 hover:bg-purple-700">
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
                  alt={`${photo.photo_type} photo`}
                  fill
                  className="object-contain"
                />
              </div>
              
              {hasAnalysis && photo.ai_analysis && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Condition Assessment:</p>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {getConditionLabel(photo.ai_analysis.condition_assessment)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(photo.ai_analysis.confidence * 100)}%
                    </p>
                  </div>

                  {photo.ai_analysis.detected_issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {photo.ai_analysis.detected_issues.map((issue, idx) => (
                          <Badge key={idx} variant="outline">
                            {getIssueLabel(issue)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {photo.ai_analysis.vehicle_size_detected && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Vehicle Size:</p>
                      <Badge variant="secondary" className="capitalize">
                        {photo.ai_analysis.vehicle_size_detected}
                      </Badge>
                    </div>
                  )}

                  {photo.ai_analysis.reasoning && (
                    <div>
                      <p className="text-sm font-semibold mb-1">AI Reasoning:</p>
                      <p className="text-sm text-muted-foreground italic">
                        {photo.ai_analysis.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Always show the component, even if empty, so businesses know where to find photos
  // if (!hasPhotos && !hasAnalysis) {
  //   return null
  // }

  return (
    <div className="space-y-6">
      {/* AI Analysis Summary */}
      {hasAnalysis ? (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>AI Analysis Summary</CardTitle>
            </div>
            <CardDescription>
              Analysis based on uploaded vehicle photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiCondition && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Overall Condition:</span>
                </div>
                <Badge variant={aiCondition === 'extreme' ? 'destructive' : aiCondition === 'heavily_soiled' ? 'default' : 'secondary'}>
                  {getConditionLabel(aiCondition)}
                </Badge>
              </div>
            )}

            {aiCondition && getConditionMarkup(aiCondition) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold">Pricing Adjustment:</span>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  +{getConditionMarkup(aiCondition)}%
                </Badge>
              </div>
            )}

            {aiDetectedIssues && aiDetectedIssues.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Detected Issues:</p>
                <div className="flex flex-wrap gap-2">
                  {aiDetectedIssues.map((issue, idx) => (
                    <Badge key={idx} variant="outline">
                      {getIssueLabel(issue)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {aiVehicleSize && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <span className="text-sm font-semibold">Vehicle Size Detected:</span>
                <Badge variant="secondary" className="capitalize">
                  {aiVehicleSize}
                </Badge>
              </div>
            )}

            {aiConfidenceScore && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <span className="text-sm font-semibold">Confidence:</span>
                <Badge variant="secondary">
                  {Math.round(aiConfidenceScore * 100)}%
                </Badge>
              </div>
            )}

            {aiSuggestedAddons && aiSuggestedAddons.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Suggested Add-ons:</p>
                <div className="space-y-2">
                  {aiSuggestedAddons.map((addon, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{addon.addon_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Detected: {getIssueLabel(addon.reason)} • {addon.priority} priority
                        </p>
                      </div>
                      <Badge 
                        variant={addon.priority === 'high' ? 'destructive' : addon.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {addon.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!aiSuggestedAddons || aiSuggestedAddons.length === 0) && aiDetectedIssues && aiDetectedIssues.length > 0 && (
              <Button
                onClick={handleLoadSuggestions}
                disabled={loadingSuggestions}
                variant="outline"
                size="sm"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Add-on Suggestions
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>AI Analysis Summary</CardTitle>
            </div>
            <CardDescription>
              No AI analysis available yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI analysis will appear here once photos are uploaded and processed during the booking process.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {hasPhotos ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Booking Photos
              <Badge variant="secondary">{photos.length}</Badge>
            </CardTitle>
            <CardDescription>
              Photos uploaded during booking process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Booking Photos
            </CardTitle>
            <CardDescription>
              No photos uploaded yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Photos uploaded during the booking process will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
