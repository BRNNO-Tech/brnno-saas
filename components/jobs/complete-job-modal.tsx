'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getJobChecklist, completeJobChecklist } from '@/lib/actions/checklists'
import { toast } from 'sonner'

interface CompleteJobModalProps {
  open: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
}

interface ChecklistItem {
  id: string
  item_name: string
  item_type: string
  inventory_item_id: string | null
  estimated_quantity?: number | null
}

interface JobChecklist {
  id: string
  items?: ChecklistItem[]
}

export function CompleteJobModal({
  open,
  onClose,
  jobId,
  jobTitle
}: CompleteJobModalProps) {
  const [checklist, setChecklist] = useState<JobChecklist | null>(null)
  const [inventoryUsage, setInventoryUsage] = useState<Record<string, number>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

      const usage: Record<string, number> = {}
      data.items?.forEach((item: ChecklistItem) => {
        if (
          item.item_type === 'product' &&
          item.inventory_item_id
        ) {
          usage[item.inventory_item_id] =
            Number(item.estimated_quantity) || 0
        }
      })
      setInventoryUsage(usage)
    } catch (error) {
      console.error('Error loading checklist:', error)
      toast.error('Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    if (!checklist) return

    setSubmitting(true)
    try {
      const usageArray = Object.entries(inventoryUsage)
        .map(([itemId, quantity]) => ({
          itemId,
          quantityUsed: quantity
        }))
        .filter((u) => u.quantityUsed > 0)

      await completeJobChecklist(checklist.id, usageArray)

      toast.success('Job completed! Inventory updated.')
      onClose()
    } catch (error) {
      console.error('Error completing job:', error)
      toast.error('Failed to complete job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const productItems =
    checklist?.items?.filter(
      (i): i is ChecklistItem & { inventory_item_id: string } =>
        i.item_type === 'product' && i.inventory_item_id != null
    ) ?? []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Confirm inventory usage for <strong>{jobTitle}</strong>
          </p>

          {productItems.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Products Used</h4>
              {productItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Label className="flex-1 text-sm">{item.item_name}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={inventoryUsage[item.inventory_item_id] ?? 0}
                    onChange={(e) =>
                      setInventoryUsage({
                        ...inventoryUsage,
                        [item.inventory_item_id]:
                          parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-zinc-500">units</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No inventory items to track for this job.
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Completing...' : 'Complete Job'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
