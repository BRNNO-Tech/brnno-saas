'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, DollarSign, Edit, Lock, Download } from 'lucide-react'
import { deleteInvoice, markInvoiceAsPaid } from '@/lib/actions/invoices'
import EditInvoiceDialog from './edit-invoice-dialog'
import { useState } from 'react'
import { useFeatureGate } from '@/hooks/use-feature-gate'

type Invoice = {
  id: string
  status: string
  total: number
  paid_amount: number
  created_at: string
  client_id: string | null
  client: { name: string } | null
  invoice_items: any[]
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
        body: JSON.stringify({ type: 'invoice', data: { invoiceId } })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export')
      }
      
      const result = await response.json()
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
          
          return (
            <Card key={invoice.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
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
                  
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {invoice.invoice_items?.length || 0} item(s) • Created {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="mt-2">
                    <p className="text-xl font-semibold">
                      ${invoice.total.toFixed(2)}
                    </p>
                    {invoice.paid_amount > 0 && invoice.status !== 'paid' && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Paid: ${invoice.paid_amount.toFixed(2)} • Remaining: ${remainingAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportPDF(invoice.id)}
                    disabled={!can('export_pdf')}
                    className={!can('export_pdf') ? "opacity-50 cursor-not-allowed" : ""}
                    title={!can('export_pdf') ? "Upgrade to Pro for PDF export" : "Export PDF"}
                  >
                    {!can('export_pdf') ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {invoice.status === 'unpaid' && (
                    <Button
                      size="sm"
                      onClick={() => handleQuickPay(invoice.id)}
                    >
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

