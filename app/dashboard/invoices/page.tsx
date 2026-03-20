export const dynamic = 'force-dynamic'

import { getInvoices } from '@/lib/actions/invoices'
import { canAccessInvoices } from '@/lib/actions/permissions'
import InvoiceList from '@/components/invoices/invoice-list'
import CreateInvoiceButton from '@/components/invoices/create-invoice-button'

export default async function InvoicesPage() {
  const invoices = await getInvoices()
  const hasInvoiceModule = await canAccessInvoices()

  const unpaid = invoices.filter(i => i.status === 'unpaid')
  const paid = invoices.filter(i => i.status === 'paid')
  const outstanding = unpaid.reduce((sum, i) => {
    const t = Number(i.total) || 0
    const p = Number(i.paid_amount) || 0
    return sum + Math.max(0, t - p)
  }, 0)

  return (
    <div className="w-full pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Invoices
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            {invoices.length} total invoices
          </p>
        </div>
        <CreateInvoiceButton hasModule={hasInvoiceModule} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] mb-6">
        <StatCard label="Total" value={invoices.length} />
        <StatCard label="Unpaid" value={unpaid.length} accent="red" />
        <StatCard label="Paid" value={paid.length} accent="green" />
        <StatCard label="Outstanding" value={`$${outstanding.toFixed(2)}`} accent="amber" />
      </div>

      <InvoiceList invoices={invoices} hasModule={hasInvoiceModule} />
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
  accent?: 'red' | 'green' | 'amber'
}) {
  const valueColor = accent === 'red'
    ? 'text-[var(--dash-red)]'
    : accent === 'green'
    ? 'text-[var(--dash-green)]'
    : accent === 'amber'
    ? 'text-[var(--dash-amber)]'
    : 'text-[var(--dash-text)]'

  const borderColor = accent === 'red'
    ? 'border-b-[var(--dash-red)]'
    : accent === 'green'
    ? 'border-b-[var(--dash-green)]'
    : accent === 'amber'
    ? 'border-b-[var(--dash-amber)]'
    : 'border-b-transparent'

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
