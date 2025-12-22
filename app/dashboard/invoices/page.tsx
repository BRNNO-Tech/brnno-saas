import { getInvoices } from '@/lib/actions/invoices'
import CreateInvoiceButton from '@/components/invoices/create-invoice-button'
import InvoiceList from '@/components/invoices/invoice-list'

export default async function InvoicesPage() {
  const invoices = await getInvoices()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Invoices
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage invoices and payments
          </p>
        </div>
        <CreateInvoiceButton />
      </div>
      
      <InvoiceList invoices={invoices} />
    </div>
  )
}

