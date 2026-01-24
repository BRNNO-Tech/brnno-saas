'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus } from 'lucide-react'
import type { InventoryItem } from '@/lib/actions/inventory'

type FilterType = 'all' | 'low_stock' | 'out_of_stock'

export default function InventoryTableClient({
  items,
  stats
}: {
  items: InventoryItem[]
  stats: { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number }
}) {
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') as FilterType) || 'all'
  const [filter, setFilter] = useState<FilterType>(initialFilter)
  const [search, setSearch] = useState('')

  // Update filter when URL param changes
  useEffect(() => {
    const urlFilter = searchParams.get('filter') as FilterType
    if (urlFilter && ['all', 'low_stock', 'out_of_stock'].includes(urlFilter)) {
      setFilter(urlFilter)
    }
  }, [searchParams])

  const filteredItems = useMemo(() => {
    let filtered = items

    // Apply filter
    if (filter === 'low_stock') {
      filtered = filtered.filter(item =>
        item.current_quantity <= item.low_stock_threshold && item.current_quantity > 0
      )
    } else if (filter === 'out_of_stock') {
      filtered = filtered.filter(item => item.current_quantity === 0)
    }

    // Apply search
    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return filtered
  }, [items, filter, search])

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-lg font-semibold mb-2">No inventory items yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Start tracking your supplies by adding your first item
          </p>
          <Link href="/dashboard/inventory/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Items</CardTitle>
          <div className="flex gap-3 items-center">
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'low_stock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('low_stock')}
              >
                Low Stock
                {stats.lowStockItems > 0 && (
                  <Badge className="ml-2 bg-yellow-600">{stats.lowStockItems}</Badge>
                )}
              </Button>
              <Button
                variant={filter === 'out_of_stock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('out_of_stock')}
              >
                Out of Stock
                {stats.outOfStockItems > 0 && (
                  <Badge className="ml-2 bg-red-600">{stats.outOfStockItems}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Item</th>
                <th className="text-left p-3 font-semibold">Category</th>
                <th className="text-right p-3 font-semibold">Quantity</th>
                <th className="text-right p-3 font-semibold">Unit</th>
                <th className="text-right p-3 font-semibold">Value</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-600 dark:text-zinc-400">
                    No items found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.current_quantity <= item.low_stock_threshold && item.current_quantity > 0
                  const isOutOfStock = item.current_quantity === 0
                  const itemValue = item.current_quantity * (item.cost_per_unit || 0)

                  return (
                    <tr
                      key={item.id}
                      className={`border-b hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        isOutOfStock ? 'bg-red-50/50 dark:bg-red-950/20' :
                        isLowStock ? 'bg-yellow-50/50 dark:bg-yellow-950/20' :
                        ''
                      }`}
                    >
                      <td className="p-3">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                        {item.sku && (
                          <div className="text-sm text-zinc-600">SKU: {item.sku}</div>
                        )}
                      </td>
                      <td className="p-3 text-zinc-600">
                        {item.category?.name || '—'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {item.current_quantity.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-zinc-600">
                        {item.unit_of_measure}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ${itemValue.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/dashboard/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
