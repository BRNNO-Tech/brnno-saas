import {
  getChecklistInventoryItems,
  getChecklistLowStockItems
} from '@/lib/actions/inventory-checklist'
import { canAccessInventory } from '@/lib/actions/permissions'
import { InventoryDashboard } from '@/components/inventory/inventory-dashboard'
import UpgradePrompt from '@/components/upgrade-prompt'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const canView = await canAccessInventory()
  if (!canView) {
    return <UpgradePrompt moduleMode feature="Inventory" />
  }
  const [items, lowStockItems] = await Promise.all([
    getChecklistInventoryItems(),
    getChecklistLowStockItems()
  ])

  return (
    <InventoryDashboard
      initialItems={items}
      lowStockItems={lowStockItems}
    />
  )
}
