'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  FileText,
  Phone,
  ShoppingCart,
  Gift,
  X,
  RotateCcw,
} from 'lucide-react'

interface ScriptsCategoriesPanelProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categoryCounts: Record<string, number>
}

const categories = [
  { value: 'all', label: 'All Scripts', icon: FileText },
  { value: 'new_lead_instant_reply', label: 'New Lead Instant Reply', icon: MessageSquare },
  { value: 'quote_follow_up', label: 'Quote Follow-up', icon: FileText },
  { value: 'missed_call_text_back', label: 'Missed Call Text-back', icon: Phone },
  { value: 'shopping_around', label: 'Shopping Around', icon: ShoppingCart },
  { value: 'incentive_offer', label: 'Incentive Offer', icon: Gift },
  { value: 'break_up_message', label: 'Break-up Message', icon: X },
  { value: 'reactivation', label: 'Reactivation', icon: RotateCcw },
  { value: 'custom', label: 'Custom', icon: FileText },
]

export function ScriptsCategoriesPanel({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: ScriptsCategoriesPanelProps) {
  return (
    <div className="p-4 space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/35 mb-3">
        Categories
      </h3>
      {categories.map((category) => {
        const Icon = category.icon
        const count = categoryCounts[category.value] || 0
        const isSelected = selectedCategory === category.value

        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150',
              isSelected
                ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                : 'text-zinc-600 dark:text-white/55 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{category.label}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}
