'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Mail,
  Plus,
  Copy,
  Trash2,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { type Script } from '@/lib/actions/scripts'
import { deleteScript, duplicateScript } from '@/lib/actions/scripts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ScriptsListPanelProps {
  scripts: Script[]
  selectedScriptId: string | null
  onSelectScript: (scriptId: string) => void
  onScriptsUpdate: (scripts: Script[]) => void
}

export function ScriptsListPanel({
  scripts,
  selectedScriptId,
  onSelectScript,
  onScriptsUpdate,
}: ScriptsListPanelProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null)

  async function handleDelete(script: Script) {
    setScriptToDelete(script)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!scriptToDelete) return
    const success = await deleteScript(scriptToDelete.id)
    if (success) {
      toast.success('Script deleted')
      onScriptsUpdate(scripts.filter(s => s.id !== scriptToDelete.id))
    } else {
      toast.error('Failed to delete script')
    }
    setDeleteDialogOpen(false)
    setScriptToDelete(null)
  }

  async function handleDuplicate(script: Script) {
    const result = await duplicateScript(script.id)
    if (result) {
      toast.success('Script duplicated')
      router.refresh()
    } else {
      toast.error('Failed to duplicate script')
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      new_lead_instant_reply: 'New Lead',
      quote_follow_up: 'Quote Follow-up',
      missed_call_text_back: 'Missed Call',
      shopping_around: 'Shopping',
      incentive_offer: 'Incentive',
      break_up_message: 'Break-up',
      reactivation: 'Reactivation',
      custom: 'Custom',
    }
    return labels[category] || category
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'friendly':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      case 'premium':
        return 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
      case 'direct':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300'
    }
  }

  if (scripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FileText className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium">No scripts found</p>
          <p className="text-xs">Create your first script to get started</p>
          <Button
            onClick={() => router.push('/dashboard/leads/scripts/new')}
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Script
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Scripts
          </h2>
          <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
            {scripts.length} script{scripts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/leads/scripts/new')}
          className="bg-violet-600 hover:bg-violet-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Script
        </Button>
      </div>

      {scripts.map((script) => {
        const isSelected = selectedScriptId === script.id
        const replyRate = script.usage_count > 0
          ? ((script.reply_count / script.usage_count) * 100).toFixed(1)
          : '0'
        const bookingRate = script.usage_count > 0
          ? ((script.booking_count / script.usage_count) * 100).toFixed(1)
          : '0'

        return (
          <div
            key={script.id}
            onClick={() => onSelectScript(script.id)}
            className={cn(
              'p-4 rounded-xl border cursor-pointer transition-all duration-200',
              'hover:bg-zinc-50 dark:hover:bg-white/5 hover:shadow-md hover:-translate-y-0.5',
              isSelected
                ? 'border-violet-500/50 dark:border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/10 shadow-md ring-2 ring-violet-500/20 dark:ring-violet-500/20'
                : 'border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                    {script.name}
                  </h4>
                  {script.is_ab_test && (
                    <Badge variant="outline" className="text-xs">
                      A/B Test {script.ab_variant}
                    </Badge>
                  )}
                  {!script.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={cn('text-xs capitalize', getToneColor(script.tone))}>
                    {script.tone}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {script.channel === 'sms' ? (
                      <MessageSquare className="h-3 w-3 mr-1 inline" />
                    ) : (
                      <Mail className="h-3 w-3 mr-1 inline" />
                    )}
                    {script.channel.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(script.category)}
                  </Badge>
                </div>

                <p className="text-sm text-zinc-600 dark:text-white/55 line-clamp-2 mb-3">
                  {script.body}
                </p>

                {/* Performance Metrics */}
                {script.usage_count > 0 && (
                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-white/55">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>{replyRate}% reply</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{bookingRate}% book</span>
                    </div>
                    {script.avg_time_to_book && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{Math.round(script.avg_time_to_book / 60)}h avg</span>
                      </div>
                    )}
                    {script.total_revenue > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${script.total_revenue.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate(script)
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(script)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Script?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{scriptToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
