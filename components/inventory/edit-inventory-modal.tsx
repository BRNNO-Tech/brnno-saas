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
import { updateChecklistInventoryItem } from '@/lib/actions/inventory-checklist'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  current_stock: number
  minimum_stock: number
  unit_cost?: number | null
  supplier?: string | null
  notes?: string | null
}

interface EditInventoryModalProps {
  open: boolean
  onClose: () => void
  item: InventoryItem
}

export function EditInventoryModal({
  open,
  onClose,
  item
}: EditInventoryModalProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    current_stock: Number(item.current_stock) ?? 0,
    minimum_stock: Number(item.minimum_stock) ?? 0,
    unit_cost: item.unit_cost != null ? Number(item.unit_cost) : 0,
    supplier: item.supplier ?? '',
    notes: item.notes ?? ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && item) {
      setFormData({
        name: item.name,
        current_stock: Number(item.current_stock) ?? 0,
        minimum_stock: Number(item.minimum_stock) ?? 0,
        unit_cost: item.unit_cost != null ? Number(item.unit_cost) : 0,
        supplier: item.supplier ?? '',
        notes: item.notes ?? ''
      })
    }
  }, [open, item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await updateChecklistInventoryItem(item.id, {
        name: formData.name,
        current_stock: formData.current_stock,
        minimum_stock: formData.minimum_stock,
        unit_cost: formData.unit_cost || undefined,
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined
      })
      toast.success('Item updated')
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>

        {/* Read-only category & unit */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Category</span>
            <p className="font-medium capitalize">{item.category}</p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Unit</span>
            <p className="font-medium">{item.unit}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Item Name *</Label>
            <Input
              id="edit-name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Interior Cleaner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-current_stock">Current Stock *</Label>
              <Input
                id="edit-current_stock"
                type="number"
                required
                step="0.1"
                min={0}
                value={formData.current_stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_stock: parseFloat(e.target.value) || 0
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-minimum_stock">Minimum Stock *</Label>
              <Input
                id="edit-minimum_stock"
                type="number"
                required
                step="0.1"
                min={0}
                value={formData.minimum_stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimum_stock: parseFloat(e.target.value) || 0
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-unit_cost">Cost per Unit</Label>
            <Input
              id="edit-unit_cost"
              type="number"
              step="0.01"
              min={0}
              value={formData.unit_cost || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unit_cost: parseFloat(e.target.value) || 0
                })
              }
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="edit-supplier">Supplier</Label>
            <Input
              id="edit-supplier"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              placeholder="Chemical Guys, AutoZone, etc."
            />
          </div>

          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Any additional info..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
