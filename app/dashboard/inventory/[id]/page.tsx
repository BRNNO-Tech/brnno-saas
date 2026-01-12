import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInventoryItem } from '@/lib/actions/inventory'
import { notFound } from 'next/navigation'
import AddStockButton from '@/components/inventory/add-stock-button'
import RemoveStockButton from '@/components/inventory/remove-stock-button'
import AdjustStockButton from '@/components/inventory/adjust-stock-button'
import LogUsageButton from '@/components/inventory/log-usage-button'
import DeleteItemButton from '@/components/inventory/delete-item-button'
import DuplicateItemButton from '@/components/inventory/duplicate-item-button'

export const dynamic = 'force-dynamic'

export default async function InventoryItemPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const item = await getInventoryItem(id)

  if (!item) {
    notFound()
  }

  const isLowStock = item.current_quantity <= item.low_stock_threshold && item.current_quantity > 0
  const isOutOfStock = item.current_quantity === 0
  const itemValue = item.current_quantity * (item.cost_per_unit || 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            {item.sku && (
              <p className="text-zinc-600 dark:text-zinc-400">SKU: {item.sku}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/inventory/${item.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DuplicateItemButton itemId={item.id} />
          <DeleteItemButton itemId={item.id} itemName={item.name} />
        </div>
      </div>

      {/* Status Alert */}
      {isOutOfStock && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 font-semibold">
            ⚠️ Out of Stock - Restock needed
          </p>
        </div>
      )}

      {isLowStock && !isOutOfStock && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
            ⚠️ Low Stock - Consider restocking soon
          </p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.current_quantity.toFixed(2)} {item.unit_of_measure}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.low_stock_threshold.toFixed(2)} {item.unit_of_measure}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(item.cost_per_unit || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${itemValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <AddStockButton item={item} />
            <RemoveStockButton item={item} />
            <AdjustStockButton item={item} />
            <LogUsageButton item={item} />
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Item Details */}
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Category</p>
              <p className="font-medium">{item.category?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Unit of Measure</p>
              <p className="font-medium">{item.unit_of_measure}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Vendor</p>
              <p className="font-medium">{item.vendor || '—'}</p>
            </div>
            {item.notes && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Notes</p>
                <p className="font-medium">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Stock Status</p>
              <div className="mt-1">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    In Stock
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Last Updated</p>
              <p className="font-medium">
                {new Date(item.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Created</p>
              <p className="font-medium">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Adjustments Log */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            {item.adjustments && item.adjustments.length > 0 ? (
              <div className="space-y-3">
                {item.adjustments.map((adj: any) => (
                  <div key={adj.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${
                      adj.adjustment_type === 'add' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {adj.adjustment_type === 'add' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {adj.adjustment_type === 'add' ? '+' : ''}{adj.quantity_change.toFixed(2)} {item.unit_of_measure}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {new Date(adj.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-600 capitalize">
                        {adj.reason?.replace(/_/g, ' ')}
                      </p>
                      {adj.notes && (
                        <p className="text-sm text-zinc-500">{adj.notes}</p>
                      )}
                      {adj.adjusted_by_member && (
                        <p className="text-xs text-zinc-500">by {adj.adjusted_by_member.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                No adjustments yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage Log */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Log</CardTitle>
          </CardHeader>
          <CardContent>
            {item.usage_logs && item.usage_logs.length > 0 ? (
              <div className="space-y-3">
                {item.usage_logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {log.quantity_used.toFixed(2)} {item.unit_of_measure} used
                        </p>
                        <p className="text-sm text-zinc-600">
                          {new Date(log.date_used).toLocaleDateString()}
                        </p>
                      </div>
                      {log.job && (
                        <p className="text-sm text-zinc-600">
                          Job: {log.job.title}
                        </p>
                      )}
                      {log.team_member && (
                        <p className="text-xs text-zinc-500">by {log.team_member.name}</p>
                      )}
                      {log.notes && (
                        <p className="text-sm text-zinc-500">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                No usage logged yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Future Features */}
      <Card>
        <CardHeader>
          <CardTitle>Future Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div>
              <p className="font-medium">Usage per Job</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Track which products are used on each job</p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div>
              <p className="font-medium">Auto-deduct on Job Completion</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Automatically reduce stock when jobs are completed</p>
            </div>
            <Badge className="bg-purple-600">Pro Feature</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div>
              <p className="font-medium">Multi-Location Inventory</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Track inventory across multiple locations</p>
            </div>
            <Badge className="bg-blue-600">Fleet Tier</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
