import { Suspense } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, TrendingDown, DollarSign, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getInventoryStats, getInventoryItems } from '@/lib/actions/inventory'
import InventoryTableClient from '@/components/inventory/inventory-table-client'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Track and manage your supplies
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <StatsCards />
      </Suspense>

      {/* Inventory Table with Filters */}
      <Suspense fallback={<TableLoading />}>
        <InventoryTable />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  const stats = await getInventoryStats()

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-zinc-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.lowStockItems}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.outOfStockItems}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalValue.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function InventoryTable() {
  const [items, stats] = await Promise.all([
    getInventoryItems(),
    getInventoryStats()
  ])

  return <InventoryTableClient items={items} stats={stats} />
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableLoading() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
