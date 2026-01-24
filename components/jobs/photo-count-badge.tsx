'use client'

import { Badge } from '@/components/ui/badge'
import { Camera } from 'lucide-react'

interface PhotoCountBadgeProps {
  count: number
  size?: 'sm' | 'default'
}

export function PhotoCountBadge({ count, size = 'default' }: PhotoCountBadgeProps) {
  if (count === 0) return null

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 ${size === 'sm' ? 'text-xs' : ''}`}
    >
      <Camera className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {count}
    </Badge>
  )
}
