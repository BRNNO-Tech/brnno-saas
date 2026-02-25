'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, DollarSign, Edit, Lock, Download } from 'lucide-react'
import { deleteInvoice, markInvoiceAsPaid } from '@/lib/actions/invoices'
import EditInvoiceDialog from './edit-invoice-dialog'
import { useState } from 'react'
import { useFeatureGate } from '@/hooks/use-feature-gate'

type InvoiceItem = {
  id: string
  name: string
  description?: string | null
  price: number
  quantity: number
}

type Invoice = {
  id: string
  status: string
  total: number
  paid_amount: number
  created_at: string
  client_id: string | null
  notes?: string | null
  discount_code?: string | null
  discount_amount?: number | null
  client: { name: string } | null
  invoice_items: InvoiceItem[]
  payments: any[]
}

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const { can } = useFeatureGate()

  async function handleExportPDF(invoiceId: string) {
    if (!can('export_pdf')) {
      alert('Upgrade to Pro or Fleet plan to export PDFs')
      return
    }
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice', data: { invoiceId } }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export')
      }
      alert('PDF export initiated. This feature is coming soon!')
    } catch (error: any) {
      console.error('Export error:', error)
      alert(error.message || 'Failed to export PDF')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await deleteInvoice(id)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  async function handleQuickPay(id: string) {
    if (!confirm('Mark this invoice as paid?')) return
    try {
      await markInvoiceAsPaid(id)
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Failed to mark as paid')
    }
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No invoices yet. Create your first invoice to get started.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {invoices.map((invoice) => {
          const remainingAmount = invoice.total - (invoice.paid_amount || 0)
          const subtotal = invoice.invoice_items?.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
          ) ?? invoice.total

          return (
            <Card key={invoice.id} className="p-6">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {invoice.client?.name || 'No client'}
                    </h3>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'unpaid' ? 'destructive' :
                      'outline'
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Created {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportPDF(invoice.id)}
                    disabled={!can('export_pdf')}
                    className={!can('export_pdf') ? 'opacity-50 cursor-not-allowed' : ''}
                    title={!can('export_pdf') ? 'Upgrade to Pro for PDF export' : 'Export PDF'}
                  >
                    {!can('export_pdf') ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  {invoice.status === 'unpaid' && (
                    <Button size="sm" onClick={() => handleQuickPay(invoice.id)}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Quick Pay
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingInvoice(invoice)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(invoice.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Line Items Breakdown */}
              {invoice.invoice_items?.length > 0 && (
                <div className="mt-4 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <th className="text-left px-4 py-2">Item</th>
                        <th className="text-center px-4 py-2">Qty</th>
                        <th className="text-right px-4 py-2">Price</th>
                        <th className="text-right px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {invoice.invoice_items.map((item, i) => (
                        <tr key={item.id || i} className="bg-white dark:bg-transparent">
                          <td className="px-4 py-2">
                            <p className="font-medium text-zinc-900 dark:text-white">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-zinc-600 dark:text-zinc-400">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-zinc-900 dark:text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals footer */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 space-y-1 border-t border-zinc-100 dark:border-zinc-800">
                    {invoice.discount_amount && invoice.discount_amount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                          <span>Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>Discount {invoice.discount_code ? `(${invoice.discount_code})` : ''}</span>
                          <span>-${invoice.discount_amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-zinc-900 dark:text-white">
                      <span>Total</span>
                      <span>${invoice.total.toFixed(2)}</span>
                    </div>
                    {invoice.paid_amount > 0 && invoice.status !== 'paid' && (
                      <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                        <span>Remaining</span>
                        <span className="text-red-500 font-medium">${remainingAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 italic">
                  {invoice.notes}
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {editingInvoice && (
        <EditInvoiceDialog
          invoice={editingInvoice}
          open={!!editingInvoice}
          onOpenChange={(open) => !open && setEditingInvoice(null)}
        />
      )}
    </>
  )
}
