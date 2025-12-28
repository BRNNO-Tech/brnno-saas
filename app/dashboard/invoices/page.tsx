export const dynamic = 'force-dynamic'

import { getInvoices } from '@/lib/actions/invoices'
import CreateInvoiceButton from '@/components/invoices/create-invoice-button'
import InvoiceList from '@/components/invoices/invoice-list'

export default async function InvoicesPage() {
  let invoices
  try {
    invoices = await getInvoices()
  } catch (error) {
    console.error('Error loading invoices:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load invoices
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading invoices.'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Invoices
          </h1>
          <p className="mt-2 text-zinc-400">
            Manage invoices and payments
          </p>
        </div>
        <CreateInvoiceButton />
      </div>
      
      <InvoiceList invoices={invoices} />
    </div>
  )
}

