'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createChecklistInventoryItem } from '@/lib/actions/inventory-checklist'
import { toast } from 'sonner'

interface AddInventoryModalProps {
  open: boolean
  onClose: () => void
}

export function AddInventoryModal({ open, onClose }: AddInventoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'product' as 'product' | 'tool' | 'supply',
    unit: 'oz',
    current_stock: 0,
    minimum_stock: 0,
    unit_cost: 0,
    supplier: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await createChecklistInventoryItem({
        ...formData,
        unit_cost: formData.unit_cost || undefined,
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined
      })
      toast.success('Item added')
      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Interior Cleaner"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as 'product' | 'tool' | 'supply'
                })
              }
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="product">Product</option>
              <option value="tool">Tool</option>
              <option value="supply">Supply</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="oz, bottle, piece"
              />
            </div>

            <div>
              <Label htmlFor="unit_cost">Cost per Unit</Label>
              <Input
                id="unit_cost"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_stock">Current Stock *</Label>
              <Input
                id="current_stock"
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
              <Label htmlFor="minimum_stock">Minimum Stock *</Label>
              <Input
                id="minimum_stock"
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
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              placeholder="Chemical Guys, AutoZone, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
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
              {submitting ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
