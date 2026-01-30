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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Low Stock Alert
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}{' '}
                running low. Time to reorder!
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
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
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Products
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                {products.length}
              </p>
            </div>
            <Package className="h-12 w-12 opacity-50 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-emerald-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Tools
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {tools.length}
              </p>
            </div>
            <Wrench className="h-12 w-12 opacity-50 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Supplies
              </p>
              <p className="mt-1 text-3xl font-bold text-purple-900 dark:text-purple-100">
                {supplies.length}
              </p>
            </div>
            <Box className="h-12 w-12 opacity-50 text-purple-600 dark:text-purple-400" />
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
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' &&
                ` (${items.filter((i) => i.category === f).length})`}
            </button>
          ))}
        </div>

        <Button onClick={() => setShowAddModal(true)}>
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
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Box className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            No {filter !== 'all' ? filter + 's' : 'items'} yet
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="mt-4"
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
