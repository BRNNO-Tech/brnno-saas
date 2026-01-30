'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Package, Wrench, CheckCircle, MapPin, AlertTriangle } from 'lucide-react'
import {
  getJobChecklist,
  toggleChecklistItem,
  startJobChecklist
} from '@/lib/actions/checklists'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface JobChecklistModalProps {
  open: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  jobAddress?: string
}

interface ChecklistItem {
  id: string
  item_name: string
  item_type: string
  estimated_quantity?: number | null
  is_checked: boolean
}

interface JobChecklist {
  id: string
  items?: ChecklistItem[]
}

export function JobChecklistModal({
  open,
  onClose,
  jobId,
  jobTitle,
  jobAddress
}: JobChecklistModalProps) {
  const [checklist, setChecklist] = useState<JobChecklist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && jobId) {
      loadChecklist()
    }
  }, [open, jobId])

  async function loadChecklist() {
    setLoading(true)
    try {
      const data = await getJobChecklist(jobId)
      setChecklist(data)
    } catch (error) {
      console.error('Error loading checklist:', error)
      toast.error('Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(itemId: string, currentState: boolean) {
    try {
      await toggleChecklistItem(itemId, !currentState)
      await loadChecklist()
    } catch (error) {
      console.error('Error toggling item:', error)
      toast.error('Failed to update item')
    }
  }

  async function handleStartJob() {
    if (!checklist) return

    const allChecked =
      checklist.items?.every((item) => item.is_checked) ?? false

    if (!allChecked) {
      const confirmed = window.confirm(
        'Not all items are checked. Continue anyway?'
      )
      if (!confirmed) return
    }

    try {
      await startJobChecklist(checklist.id)
      toast.success('Job started!')

      if (jobAddress) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(jobAddress)}`
        window.open(mapsUrl, '_blank')
      }

      onClose()
    } catch (error) {
      console.error('Error starting job:', error)
      toast.error('Failed to start job')
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const items = checklist?.items ?? []
  const products = items.filter((i) => i.item_type === 'product')
  const tools = items.filter((i) => i.item_type === 'tool')
  const tasks = items.filter((i) => i.item_type === 'task')

  const allChecked = items.length > 0 && items.every((item) => item.is_checked)
  const checkedCount = items.filter((item) => item.is_checked).length
  const totalCount = items.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{jobTitle}</DialogTitle>
          {jobAddress && (
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              <MapPin className="h-4 w-4" />
              {jobAddress}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Checklist Progress</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {checkedCount} / {totalCount}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Package className="h-5 w-5 text-blue-600" />
                Products
              </h3>
              <div className="space-y-2">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  >
                    <Checkbox
                      checked={item.is_checked}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.is_checked)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          item.is_checked && 'text-zinc-500 line-through'
                        )}
                      >
                        {item.item_name}
                      </p>
                      {item.estimated_quantity != null && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {item.estimated_quantity} units
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {tools.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Wrench className="h-5 w-5 text-emerald-600" />
                Tools
              </h3>
              <div className="space-y-2">
                {tools.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  >
                    <Checkbox
                      checked={item.is_checked}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.is_checked)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          item.is_checked && 'text-zinc-500 line-through'
                        )}
                      >
                        {item.item_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Pre-Job Tasks
              </h3>
              <div className="space-y-2">
                {tasks.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  >
                    <Checkbox
                      checked={item.is_checked}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.is_checked)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          item.is_checked && 'text-zinc-500 line-through'
                        )}
                      >
                        {item.item_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning if not all checked */}
          {!allChecked && totalCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Checklist incomplete
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  You can still start the job, but make sure you have everything
                  you need.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartJob} className="flex-1">
              Route to Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
