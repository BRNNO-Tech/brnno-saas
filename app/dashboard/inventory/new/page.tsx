import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InventoryItemForm from '@/components/inventory/inventory-item-form'
import { getInventoryCategories } from '@/lib/actions/inventory'

export const dynamic = 'force-dynamic'

export default async function NewInventoryItemPage() {
  const categories = await getInventoryCategories()

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Add Inventory Item</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Add a new item to your inventory
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryItemForm categories={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
