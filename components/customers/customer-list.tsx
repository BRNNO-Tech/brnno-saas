'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Mail, 
  Phone, 
  Trash2, 
  Edit, 
  Eye,
  Search,
  DollarSign,
  Briefcase,
  Calendar,
  TrendingUp,
  User
} from 'lucide-react'
import { deleteClient } from '@/lib/actions/clients'
import EditCustomerDialog from './edit-customer-dialog'
import Link from 'next/link'

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
  stats: {
    totalJobs: number
    completedJobs: number
    totalRevenue: number
    lastJobDate: string | null
  }
}

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? Their jobs will remain but won't be linked to this customer.`)) return
    
    try {
      await deleteClient(id)
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer')
    }
  }

  // Filter customers by search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  )

  // Sort by revenue (highest first)
  const sortedCustomers = [...filteredCustomers].sort((a, b) => 
    b.stats.totalRevenue - a.stats.totalRevenue
  )

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
        <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Customers are created automatically when they book, or you can add them manually.
        </p>
      </Card>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${customers.reduce((sum, c) => sum + c.stats.totalRevenue, 0).toFixed(0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Jobs</p>
              <p className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.stats.totalJobs, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            No customers match your search.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={setEditingCustomer}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingCustomer && (
        <EditCustomerDialog
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
        />
      )}
    </>
  )
}

function CustomerCard({ 
  customer, 
  onEdit, 
  onDelete 
}: { 
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (id: string, name: string) => void
}) {
  const isVIP = customer.stats.totalRevenue > 500 // $500+ = VIP
  const daysSinceLastJob = customer.stats.lastJobDate 
    ? Math.floor((Date.now() - new Date(customer.stats.lastJobDate).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link href={`/dashboard/customers/${customer.id}`}>
      <Card className={`p-4 transition-all hover:shadow-lg cursor-pointer ${
        isVIP ? 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg font-semibold text-blue-600">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                  {customer.name}
                </h3>
                {isVIP && (
                  <span className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    VIP Customer
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1">
            {customer.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `tel:${customer.phone}`
                }}
                title={`Call ${customer.phone}`}
              >
                <Phone className="h-4 w-4 text-green-600" />
              </Button>
            )}
            {customer.email && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `mailto:${customer.email}`
                }}
                title={`Email ${customer.email}`}
              >
                <Mail className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          {customer.email && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
              {customer.email}
            </p>
          )}
          {customer.phone && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {customer.phone}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Jobs</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {customer.stats.totalJobs}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Revenue</p>
            <p className="text-lg font-bold text-green-600">
              ${customer.stats.totalRevenue.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Last Job</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {daysSinceLastJob !== null 
                ? daysSinceLastJob === 0 
                  ? 'Today'
                  : `${daysSinceLastJob}d ago`
                : 'Never'
              }
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
