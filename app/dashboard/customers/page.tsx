export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCustomersWithStats } from '@/lib/actions/clients'
import AddCustomerButton from '@/components/customers/add-customer-button'
import CustomerList from '@/components/customers/customer-list'

export default async function CustomersPage() {
  let customers
  try {
    customers = await getCustomersWithStats()
  } catch (error) {
    return (
      <div className="w-full pb-20 md:pb-0">
        <div className="border border-[var(--dash-red)]/30 bg-[var(--dash-red)]/10 px-6 py-4">
          <div className="font-dash-condensed font-bold text-[var(--dash-red)]">Unable to load customers</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
            {error instanceof Error ? error.message : 'An error occurred while loading customers.'}
          </div>
        </div>
      </div>
    )
  }

  const totalRevenue = customers.reduce((sum, c) => sum + (c.stats?.totalRevenue || 0), 0)
  const totalJobs = customers.reduce((sum, c) => sum + (c.stats?.totalJobs || 0), 0)
  const vipCount = customers.filter(c => (c.stats?.totalRevenue || 0) > 500).length

  return (
    <div className="w-full pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Customers
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            {customers.length} total customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers/maintenance"
            className="font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)]"
          >
            View maintenance clients
          </Link>
          <AddCustomerButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] mb-6">
        <StatCard label="Total" value={customers.length} />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} accent="amber" />
        <StatCard label="Total Jobs" value={totalJobs} />
        <StatCard label="VIP ($500+)" value={vipCount} accent="amber" />
      </div>

      <CustomerList customers={customers} />
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'amber'
}) {
  const valueColor = accent === 'amber' ? 'text-[var(--dash-amber)]' : 'text-[var(--dash-text)]'
  const borderColor = accent === 'amber' ? 'border-b-[var(--dash-amber)]' : 'border-b-transparent'

  return (
    <div className={`bg-[var(--dash-graphite)] p-5 border-b-2 ${borderColor}`}>
      <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">
        {label}
      </div>
      <div className={`font-dash-condensed font-extrabold text-4xl leading-none tracking-tight ${valueColor}`}>
        {value}
      </div>
    </div>
  )
}
