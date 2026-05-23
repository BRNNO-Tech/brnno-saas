import Link from 'next/link'
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
    <div className="p-8 space-y-6">
      <nav
        className="flex flex-wrap gap-px border-b border-[var(--dash-border)] bg-[var(--dash-border)] overflow-x-auto"
        aria-label="Inventory sections"
      >
        <Link
          href="/dashboard/inventory"
          className="px-4 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider whitespace-nowrap bg-[var(--dash-graphite)] text-[var(--dash-amber)]"
        >
          Inventory
        </Link>
        <Link
          href="/dashboard/checklist-templates"
          className="px-4 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider whitespace-nowrap bg-[var(--dash-surface)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text-dim)] transition-colors"
        >
          Checklists
        </Link>
      </nav>

      <InventoryDashboard
        initialItems={items}
        lowStockItems={lowStockItems}
      />
    </div>
  )
}
