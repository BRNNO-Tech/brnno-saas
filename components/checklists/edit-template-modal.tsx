'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Package, Wrench, CheckCircle } from 'lucide-react'
import { getChecklistInventoryItems } from '@/lib/actions/inventory-checklist'
import { toast } from 'sonner'

interface EditTemplateModalProps {
  open: boolean
  onClose: () => void
  template: {
    id: string
    service_name: string
    items?: Array<{
      id?: string
      item_type: string
      inventory_item_id: string | null
      item_name: string
      estimated_quantity: number | null
      inventory_item?: { name: string; unit?: string }
    }>
  }
}

type ItemType = 'product' | 'tool' | 'task'

interface TemplateItem {
  item_type: ItemType
  inventory_item_id: string | null
  item_name: string
  estimated_quantity: number | null
}

export function EditTemplateModal({ open, onClose, template }: EditTemplateModalProps) {
  const [serviceName, setServiceName] = useState(template.service_name)
  const [items, setItems] = useState<TemplateItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setServiceName(template.service_name)
      setItems(
        (template.items ?? []).map((it) => ({
          item_type: it.item_type as ItemType,
          inventory_item_id: it.inventory_item_id ?? null,
          item_name: it.item_name ?? '',
          estimated_quantity: it.estimated_quantity ?? null,
        }))
      )
      loadInventory()
    }
  }, [open, template.service_name, template.items])

  async function loadInventory() {
    try {
      const data = await getChecklistInventoryItems()
      setInventoryItems(data ?? [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  function addItem(type: ItemType) {
    setItems([
      ...items,
      {
        item_type: type,
        inventory_item_id: null,
        item_name: '',
        estimated_quantity: null,
      },
    ])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updates: Partial<TemplateItem>) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    if (updates.inventory_item_id !== undefined) {
      const inv = inventoryItems.find((i) => i.id === updates.inventory_item_id)
      if (inv) newItems[index].item_name = inv.name
    }
    setItems(newItems)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceName.trim()) {
      toast.error('Please enter a service name')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/checklist-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName.trim(),
          items: items.map((it) => ({
            item_type: it.item_type,
            inventory_item_id: it.inventory_item_id || null,
            item_name: it.item_name || '',
            estimated_quantity: it.estimated_quantity ?? null,
          })),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to update template')
      }

      toast.success('Template updated')
      onClose()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const products = inventoryItems.filter(
    (i) => i.category === 'product' || i.category === 'supply'
  )
  const tools = inventoryItems.filter((i) => i.category === 'tool')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Checklist Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="serviceName">Service Name *</Label>
            <Input
              id="serviceName"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Full Detail, Quick Wash, Ceramic Coating, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Checklist Items</Label>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('product')}
              >
                <Package className="mr-1 h-4 w-4" />
                Add Product
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('tool')}
              >
                <Wrench className="mr-1 h-4 w-4" />
                Add Tool
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('task')}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-2">
                      {item.item_type === 'product' && (
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                      {item.item_type === 'tool' && (
                        <Wrench className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {item.item_type === 'task' && (
                        <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      {item.item_type !== 'task' && (
                        <select
                          value={item.inventory_item_id ?? ''}
                          onChange={(e) =>
                            updateItem(index, {
                              inventory_item_id: e.target.value || null,
                            })
                          }
                          className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        >
                          <option value="">Select from inventory...</option>
                          {(item.item_type === 'product' ? products : tools).map(
                            (inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name}
                              </option>
                            )
                          )}
                        </select>
                      )}

                      <Input
                        placeholder={
                          item.item_type === 'task'
                            ? 'Task name (e.g., Take before photos)'
                            : 'Or enter custom name'
                        }
                        value={item.item_name}
                        onChange={(e) =>
                          updateItem(index, { item_name: e.target.value })
                        }
                        className="text-sm"
                      />

                      {item.item_type === 'product' && (
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          placeholder="Estimated quantity (optional)"
                          value={item.estimated_quantity ?? ''}
                          onChange={(e) =>
                            updateItem(index, {
                              estimated_quantity: parseFloat(e.target.value) || null,
                            })
                          }
                          className="text-sm"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Add products, tools, or tasks to your checklist template
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !serviceName.trim()}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
