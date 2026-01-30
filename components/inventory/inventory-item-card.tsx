'use client'

import { useState } from 'react'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  updateChecklistInventoryItem,
  deleteChecklistInventoryItem,
  adjustChecklistInventoryStock
} from '@/lib/actions/inventory-checklist'
import { EditInventoryModal } from './edit-inventory-modal'
import { cn } from '@/lib/utils'
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

interface InventoryItemCardProps {
  item: InventoryItem
  onUpdate: () => void
}

export function InventoryItemCard({ item, onUpdate }: InventoryItemCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [adjusting, setAdjusting] = useState(false)

  const current = Number(item.current_stock) ?? 0
  const minimum = Number(item.minimum_stock) ?? 0
  const isLowStock = minimum > 0 && current <= minimum
  const stockPercentage =
    minimum > 0
      ? Math.min(100, (current / (minimum * 2)) * 100)
      : current > 0
        ? 100
        : 0

  async function handleAdjustStock(amount: number) {
    setAdjusting(true)
    try {
      await adjustChecklistInventoryStock(
        item.id,
        amount,
        amount > 0 ? 'Added stock' : 'Manual adjustment'
      )
      toast.success(amount > 0 ? 'Stock added' : 'Stock removed')
      onUpdate()
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Failed to adjust stock')
    } finally {
      setAdjusting(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${item.name}?`)) return

    try {
      await deleteChecklistInventoryItem(item.id)
      toast.success('Item deleted')
      onUpdate()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border p-4 transition-all hover:shadow-md',
          isLowStock
            ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
            : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {item.name}
              </h3>
              {isLowStock && (
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <p className="mt-0.5 text-xs capitalize text-zinc-500 dark:text-zinc-400">
              {item.category}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stock Level */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Stock</span>
            <span
              className={cn(
                'font-semibold',
                isLowStock
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-zinc-900 dark:text-white'
              )}
            >
              {current} {item.unit}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                isLowStock ? 'bg-amber-500' : 'bg-blue-600'
              )}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Min: {minimum} {item.unit}
          </p>
        </div>

        {/* Quick Adjust */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustStock(-1)}
            disabled={adjusting || current === 0}
            className="flex-1"
          >
            <Minus className="mr-1 h-3 w-3" />
            Use
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustStock(1)}
            disabled={adjusting}
            className="flex-1"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>

        {/* Cost Info */}
        {item.unit_cost != null && Number(item.unit_cost) > 0 && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            ${Number(item.unit_cost)}/{item.unit}
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditInventoryModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            onUpdate()
          }}
          item={item}
        />
      )}
    </>
  )
}
