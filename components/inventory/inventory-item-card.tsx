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
          'rounded-2xl border p-4 transition-all border-[var(--dash-border)] bg-[var(--dash-graphite)] hover:border-[var(--dash-border-bright)]',
          isLowStock && 'border-[var(--dash-amber)]/40 bg-[var(--dash-amber)]/8'
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-dash-condensed font-bold text-[var(--dash-text)]">
                {item.name}
              </h3>
              {isLowStock && (
                <AlertCircle className="h-4 w-4 text-[var(--dash-amber)]" />
              )}
            </div>
            <p className="mt-0.5 font-dash-mono text-[10px] uppercase tracking-wider capitalize text-[var(--dash-text-muted)]">
              {item.category}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface)]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[var(--dash-border)] bg-[var(--dash-graphite)]">
              <DropdownMenuItem onClick={() => setShowEditModal(true)} className="text-[var(--dash-text)] focus:bg-[var(--dash-surface)] focus:text-[var(--dash-text)]">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-[var(--dash-red)] focus:bg-[var(--dash-red)]/10 focus:text-[var(--dash-red)]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stock Level */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between font-dash-mono text-[11px]">
            <span className="text-[var(--dash-text-muted)]">Stock</span>
            <span
              className={cn(
                'font-semibold',
                isLowStock
                  ? 'text-[var(--dash-amber)]'
                  : 'text-[var(--dash-text)]'
              )}
            >
              {current} {item.unit}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--dash-surface)]">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                isLowStock ? 'bg-[var(--dash-amber)]' : 'bg-[var(--dash-blue)]'
              )}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <p className="mt-1 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
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
            className="flex-1 border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]"
          >
            <Minus className="mr-1 h-3 w-3" />
            Use
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustStock(1)}
            disabled={adjusting}
            className="flex-1 border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>

        {/* Cost Info */}
        {item.unit_cost != null && Number(item.unit_cost) > 0 && (
          <p className="mt-2 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
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
