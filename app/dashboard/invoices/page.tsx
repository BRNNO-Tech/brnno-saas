import { getInvoices } from '@/lib/actions/invoices'
import { canAccessInvoices } from '@/lib/actions/permissions'
import InvoiceList from '@/components/invoices/invoice-list'
import CreateInvoiceButton from '@/components/invoices/create-invoice-button'

export default async function InvoicesPage() {
  const invoices = await getInvoices()
  const hasInvoiceModule = await canAccessInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage and track your client invoices
          </p>
        </div>
        <CreateInvoiceButton hasModule={hasInvoiceModule} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={invoices.length} color="zinc" />
        <StatCard label="Unpaid" value={invoices.filter(i => i.status === 'unpaid').length} color="red" />
        <StatCard label="Paid" value={invoices.filter(i => i.status === 'paid').length} color="green" />
        <StatCard
          label="Outstanding"
          value={`$${invoices
            .filter(i => i.status === 'unpaid')
            .reduce((sum, i) => sum + (i.total - (i.paid_amount || 0)), 0)
            .toFixed(2)}`}
          color="amber"
        />
      </div>

      <InvoiceList invoices={invoices} hasModule={hasInvoiceModule} />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'zinc' | 'red' | 'green' | 'amber' }) {
  const colorMap = {
    zinc: 'text-zinc-900 dark:text-white',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  )
}
