'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, Trash2, Edit, Search, TrendingUp } from 'lucide-react'
import { deleteClient } from '@/lib/actions/clients'
import EditCustomerDialog from './edit-customer-dialog'

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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? Their jobs will remain but won't be linked to this customer.`)) return
    try {
      await deleteClient(id)
    } catch {
      alert('Failed to delete customer')
    }
  }

  const filtered = customers
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    )
    .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)

  if (customers.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No Customers Yet</div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Customers are created automatically when they book, or add them manually.</div>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="flex items-center gap-2 border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-2.5 mb-4">
        <Search className="h-3.5 w-3.5 text-[var(--dash-text-muted)] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent font-dash-mono text-[12px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] outline-none"
        />
        {searchQuery && (
          <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-10 text-center">
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No customers match your search</div>
        </div>
      ) : (
        <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          {filtered.map(customer => (
            <CustomerRow
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
          onOpenChange={open => !open && setEditingCustomer(null)}
        />
      )}
    </>
  )
}

function CustomerRow({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer
  onEdit: (c: Customer) => void
  onDelete: (id: string, name: string) => void
}) {
  const isVIP = customer.stats.totalRevenue > 500
  const daysSinceLast = customer.stats.lastJobDate
    ? Math.floor((Date.now() - new Date(customer.stats.lastJobDate).getTime()) / 86400000)
    : null

  const lastJobLabel = daysSinceLast === null
    ? 'Never'
    : daysSinceLast === 0
    ? 'Today'
    : `${daysSinceLast}d ago`

  return (
    <div className={cn(
      'bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors',
    )}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* VIP indicator */}
        <div className={cn(
          'w-0.5 h-10 rounded-sm flex-shrink-0',
          isVIP ? 'bg-[var(--dash-amber)] shadow-[0_0_6px_var(--dash-amber-dim)]' : 'bg-[var(--dash-border-bright)]'
        )} />

        {/* Avatar */}
        <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-[var(--dash-surface)] border border-[var(--dash-border-bright)] font-dash-condensed font-bold text-sm text-[var(--dash-text-dim)]">
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + contact */}
        <Link href={`/dashboard/customers/${customer.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-dash-condensed font-bold text-[16px] text-[var(--dash-text)] truncate">
              {customer.name}
            </span>
            {isVIP && (
              <span className="flex items-center gap-1 font-dash-mono text-[9px] uppercase tracking-wider text-[var(--dash-amber)] border border-[var(--dash-amber)]/30 px-1.5 py-0.5 flex-shrink-0">
                <TrendingUp className="h-2.5 w-2.5" />
                VIP
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {customer.email && (
              <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] truncate">{customer.email}</span>
            )}
            {customer.phone && (
              <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{customer.phone}</span>
            )}
          </div>
        </Link>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <div className="font-dash-mono text-[9px] text-[var(--dash-text-muted)] uppercase tracking-wider">Jobs</div>
            <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-text)]">{customer.stats.totalJobs}</div>
          </div>
          <div className="text-right">
            <div className="font-dash-mono text-[9px] text-[var(--dash-text-muted)] uppercase tracking-wider">Revenue</div>
            <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-amber)]">${customer.stats.totalRevenue.toFixed(0)}</div>
          </div>
          <div className="text-right">
            <div className="font-dash-mono text-[9px] text-[var(--dash-text-muted)] uppercase tracking-wider">Last Job</div>
            <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-text-dim)]">{lastJobLabel}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              onClick={e => e.stopPropagation()}
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-green)] hover:bg-[var(--dash-green)]/10 rounded transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              onClick={e => e.stopPropagation()}
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-blue)] hover:bg-[var(--dash-blue)]/10 rounded transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={e => { e.preventDefault(); onEdit(customer) }}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.preventDefault(); onDelete(customer.id, customer.name) }}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden flex items-center gap-4 px-4 pb-3 pl-[52px]">
        <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{customer.stats.totalJobs} jobs</span>
        <span className="font-dash-mono text-[10px] text-[var(--dash-amber)]">${customer.stats.totalRevenue.toFixed(0)}</span>
        <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{lastJobLabel}</span>
      </div>
    </div>
  )
}
