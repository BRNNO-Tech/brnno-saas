import {
  getChecklistInventoryItems,
  getChecklistLowStockItems
} from '@/lib/actions/inventory-checklist'
import { InventoryDashboard } from '@/components/inventory/inventory-dashboard'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const [items, lowStockItems] = await Promise.all([
    getChecklistInventoryItems(),
    getChecklistLowStockItems()
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Track products, tools, and supplies
        </p>
      </div>

      <InventoryDashboard
        initialItems={items}
        lowStockItems={lowStockItems}
      />
    </div>
  )
}
