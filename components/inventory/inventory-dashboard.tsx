'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, Package, Wrench, Box } from 'lucide-react'
import { AddInventoryModal } from './add-inventory-modal'
import { InventoryItemCard } from './inventory-item-card'
import { cn } from '@/lib/utils'

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

interface InventoryDashboardProps {
  initialItems: InventoryItem[]
  lowStockItems: InventoryItem[]
}

export function InventoryDashboard({
  initialItems,
  lowStockItems
}: InventoryDashboardProps) {
  const router = useRouter()
  const items = initialItems
  const [filter, setFilter] = useState<
    'all' | 'product' | 'tool' | 'supply'
  >('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((item) => item.category === filter)

  const products = items.filter((i) => i.category === 'product')
  const tools = items.filter((i) => i.category === 'tool')
  const supplies = items.filter((i) => i.category === 'supply')

  function handleCloseAddModal() {
    setShowAddModal(false)
    router.refresh()
  }

  function handleUpdate() {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-[var(--dash-amber)]/40 bg-[var(--dash-amber)]/8 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--dash-amber)]" />
            <div className="flex-1">
              <h3 className="font-dash-condensed font-bold text-[var(--dash-text)]">
                Low Stock Alert
              </h3>
              <p className="mt-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}{' '}
                running low. Time to reorder!
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-1 font-dash-mono text-[11px] font-medium text-[var(--dash-text)]"
                  >
                    {item.name}: {Number(item.current_stock)} {item.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 border-b-[var(--dash-blue)] border-b-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                Products
              </p>
              <p className="mt-1 font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">
                {products.length}
              </p>
            </div>
            <Package className="h-12 w-12 opacity-50 text-[var(--dash-blue)]" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 border-b-[var(--dash-green)] border-b-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                Tools
              </p>
              <p className="mt-1 font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">
                {tools.length}
              </p>
            </div>
            <Wrench className="h-12 w-12 opacity-50 text-[var(--dash-green)]" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 border-b-[var(--dash-amber)] border-b-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                Supplies
              </p>
              <p className="mt-1 font-dash-condensed font-extrabold text-3xl text-[var(--dash-text)]">
                {supplies.length}
              </p>
            </div>
            <Box className="h-12 w-12 opacity-50 text-[var(--dash-amber)]" />
          </div>
        </div>
      </div>

      {/* Filters and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'product', 'tool', 'supply'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-4 py-2 font-dash-mono text-[11px] font-medium uppercase tracking-wider transition-all',
                filter === f
                  ? 'bg-[var(--dash-amber)] text-[var(--dash-black)]'
                  : 'border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' &&
                ` (${items.filter((i) => i.category === f).length})`}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] py-12 text-center">
          <Box className="mx-auto mb-4 h-12 w-12 text-[var(--dash-text-muted)]" />
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            No {filter !== 'all' ? filter + 's' : 'items'} yet
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="mt-4 border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] hover:border-[var(--dash-amber)] hover:text-[var(--dash-amber)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Item
          </Button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddInventoryModal
          open={showAddModal}
          onClose={handleCloseAddModal}
        />
      )}
    </div>
  )
}
