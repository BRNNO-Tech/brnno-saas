'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import type { BookingPhoto, AIAnalysisSummary, SuggestedAddon, VehicleCondition, DetectedIssue } from '@/types/booking-photos'
import { getConditionLabel, getIssueLabel, getConditionMarkup } from '@/types/booking-photos'

interface AIAnalysisSummaryProps {
  photos: BookingPhoto[]
  suggestedAddons?: SuggestedAddon[]
  onAddonSelect?: (addonId: string) => void
}

export function AIAnalysisSummary({
  photos,
  suggestedAddons = [],
  onAddonSelect
}: AIAnalysisSummaryProps) {
  // Calculate summary from all analyzed photos
  const analyzedPhotos = photos.filter(p => p.ai_processed && p.ai_analysis)
  
  if (analyzedPhotos.length === 0) {
    return null
  }

  // Aggregate analysis results
  const allIssues = new Set<DetectedIssue>()
  const conditions: VehicleCondition[] = []
  const vehicleSizes = new Set<string>()
  let totalConfidence = 0

  analyzedPhotos.forEach(photo => {
    if (photo.ai_analysis) {
      photo.ai_analysis.detected_issues.forEach(issue => allIssues.add(issue))
      conditions.push(photo.ai_analysis.condition_assessment)
      totalConfidence += photo.ai_analysis.confidence
      if (photo.ai_analysis.vehicle_size_detected) {
        vehicleSizes.add(photo.ai_analysis.vehicle_size_detected)
      }
    }
  })

  // Determine overall condition (worst case)
  const conditionPriority: Record<VehicleCondition, number> = {
    lightly_dirty: 1,
    moderately_dirty: 2,
    heavily_soiled: 3,
    extreme: 4
  }
  
  const overallCondition = conditions.reduce((worst, current) => 
    conditionPriority[current] > conditionPriority[worst] ? current : worst,
    conditions[0] || 'lightly_dirty'
  )

  const averageConfidence = totalConfidence / analyzedPhotos.length
  const pricingAdjustment = getConditionMarkup(overallCondition)

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>AI Analysis Summary</CardTitle>
        </div>
        <CardDescription>
          Analysis based on {analyzedPhotos.length} photo{analyzedPhotos.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Condition */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Overall Condition:</span>
          </div>
          <Badge variant={overallCondition === 'extreme' ? 'destructive' : overallCondition === 'heavily_soiled' ? 'default' : 'secondary'}>
            {getConditionLabel(overallCondition)}
          </Badge>
        </div>

        {/* Pricing Adjustment */}
        {pricingAdjustment > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold">Pricing Adjustment:</span>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              +{pricingAdjustment}%
            </Badge>
          </div>
        )}

        {/* Detected Issues */}
        {allIssues.size > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Detected Issues:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(allIssues).map(issue => (
                <Badge key={issue} variant="outline">
                  {getIssueLabel(issue)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Size */}
        {vehicleSizes.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <span className="text-sm font-semibold">Vehicle Size Detected:</span>
            <Badge variant="secondary" className="capitalize">
              {Array.from(vehicleSizes).join(', ')}
            </Badge>
          </div>
        )}

        {/* Confidence Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <span className="text-sm font-semibold">Confidence:</span>
          <Badge variant="secondary">
            {(averageConfidence * 100).toFixed(0)}%
          </Badge>
        </div>

        {/* Suggested Add-ons */}
        {suggestedAddons.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Suggested Add-ons:</p>
            <div className="space-y-2">
              {suggestedAddons.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onAddonSelect?.(addon.addon_id)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{addon.addon_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Detected: {getIssueLabel(addon.reason)} • {addon.priority} priority
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={addon.priority === 'high' ? 'destructive' : addon.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {addon.priority}
                    </Badge>
                    {onAddonSelect && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
