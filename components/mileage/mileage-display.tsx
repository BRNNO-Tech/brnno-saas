'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navigation, Edit2, Check, X } from 'lucide-react'
import { updateMileage } from '@/lib/actions/mileage'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MileageDisplayProps {
  jobId: string
  mileageId?: string
  miles?: number
  isManualOverride?: boolean
  fromAddress?: string
}

export function MileageDisplay({
  jobId,
  mileageId,
  miles = 0,
  isManualOverride = false,
  fromAddress,
}: MileageDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMiles, setEditedMiles] = useState(miles.toString())
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!mileageId) return

    const newMiles = parseFloat(editedMiles)
    if (isNaN(newMiles) || newMiles < 0) {
      toast.error('Please enter a valid mileage')
      return
    }

    setIsLoading(true)
    try {
      await updateMileage(mileageId, newMiles)
      toast.success('Mileage updated')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update mileage')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedMiles(miles.toString())
    setIsEditing(false)
  }

  if (miles === 0 && !isEditing) {
    return null // Don't show if no mileage tracked
  }

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        // Edit Mode
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={editedMiles}
              onChange={(e) => setEditedMiles(e.target.value)}
              className="w-20 h-8 text-sm pr-8"
              disabled={isLoading}
            />
            <span className="absolute right-2 top-2 text-xs text-muted-foreground">
              mi
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ) : (
        // View Mode
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer group">
                <Badge variant="secondary" className="gap-1.5">
                  <Navigation className="h-3 w-3" />
                  <span>{miles} mi</span>
                  {isManualOverride && (
                    <span className="text-xs opacity-70">(edited)</span>
                  )}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {fromAddress
                  ? `From: ${fromAddress}`
                  : 'Miles from previous job'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click to edit
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
