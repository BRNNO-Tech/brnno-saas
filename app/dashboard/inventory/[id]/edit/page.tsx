import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InventoryItemForm from '@/components/inventory/inventory-item-form'
import { getInventoryItem, getInventoryCategories } from '@/lib/actions/inventory'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditInventoryItemPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const [item, categories] = await Promise.all([
    getInventoryItem(id),
    getInventoryCategories()
  ])

  if (!item) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Item</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Update item details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryItemForm 
              item={item} 
              categories={categories} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
