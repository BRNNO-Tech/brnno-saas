'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createInventoryItem, updateInventoryItem, type InventoryItem, type InventoryCategory } from '@/lib/actions/inventory'
import CreateCategoryButton from './create-category-button'

export default function InventoryItemForm({ 
  item, 
  categories: initialCategories 
}: { 
  item?: InventoryItem
  categories: InventoryCategory[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState(initialCategories)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      if (item) {
        await updateInventoryItem(item.id, formData)
      } else {
        // For new items, map initial_quantity to current_quantity
        const initialQuantity = formData.get('initial_quantity')
        if (initialQuantity) {
          formData.set('current_quantity', initialQuantity as string)
        }
        await createInventoryItem(formData)
      }
      router.push('/dashboard/inventory')
      router.refresh()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={item?.name}
            placeholder="e.g., Ceramic Coating"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU / Product Code</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={item?.sku || ''}
              placeholder="Optional"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="category_id">Category</Label>
              <CreateCategoryButton 
                onCategoryCreated={async () => {
                  // Refresh the page to get updated categories
                  router.refresh()
                }}
              />
            </div>
            <select
              id="category_id"
              name="category_id"
              defaultValue={item?.category_id || ''}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                No categories yet. Create one to organize your inventory.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Measurement & Cost */}
      <div className="space-y-4">
        <h3 className="font-semibold">Measurement & Cost</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
            <select
              id="unit_of_measure"
              name="unit_of_measure"
              required
              defaultValue={item?.unit_of_measure || 'oz'}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="oz">Ounces (oz)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="gal">Gallons (gal)</option>
              <option value="l">Liters (L)</option>
              <option value="count">Count/Units</option>
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cost_per_unit">Cost Per Unit ($)</Label>
            <Input
              id="cost_per_unit"
              name="cost_per_unit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.cost_per_unit || ''}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="vendor">Vendor / Supplier</Label>
          <Input
            id="vendor"
            name="vendor"
            defaultValue={item?.vendor || ''}
            placeholder="e.g., Chemical Guys, Meguiar's"
          />
        </div>
      </div>

      {/* Stock Levels */}
      <div className="space-y-4">
        <h3 className="font-semibold">Stock Levels</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {!item && (
            <div>
              <Label htmlFor="initial_quantity">Initial Quantity</Label>
              <Input
                id="initial_quantity"
                name="initial_quantity"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Starting quantity (can adjust later)
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
            <Input
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.low_stock_threshold || '0'}
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Alert when stock falls below this amount
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={item?.notes || ''}
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
