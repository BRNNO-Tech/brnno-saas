'use client'

import { useState } from 'react'
import { Trash2, DollarSign, Edit, Lock, Download, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteInvoice, generateInvoiceShareToken, markInvoiceAsPaid } from '@/lib/actions/invoices'
import EditInvoiceDialog from './edit-invoice-dialog'

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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'paid': return { badge: 'text-[var(--dash-green)] border-[var(--dash-green)]/30', bar: 'bg-[var(--dash-green)]', label: 'Paid' }
    case 'unpaid': return { badge: 'text-[var(--dash-red)] border-[var(--dash-red)]/30', bar: 'bg-[var(--dash-red)]', label: 'Unpaid' }
    default: return { badge: 'text-[var(--dash-text-muted)] border-[var(--dash-border-bright)]', bar: 'bg-[var(--dash-border-bright)]', label: status }
  }
}

function InvoiceCard({
  invoice,
  hasModule,
  onEdit,
  onDelete,
  onQuickPay,
  onExportPDF,
  onShare,
}: {
  invoice: Invoice
  hasModule: boolean
  onEdit: (inv: Invoice) => void
  onDelete: (id: string) => void
  onQuickPay: (id: string) => void
  onExportPDF: (id: string) => void
  onShare: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const s = getStatusStyle(invoice.status)
  const remaining = invoice.total - (invoice.paid_amount || 0)
  const subtotal = invoice.invoice_items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? invoice.total

  return (
    <div className="bg-[var(--dash-graphite)] hover:bg-[var(--dash-surface)] transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Status bar */}
        <div className={cn('w-0.5 h-10 rounded-sm flex-shrink-0', s.bar)} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('font-dash-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider', s.badge)}>
              {s.label}
            </span>
            <span className="font-dash-mono text-[10px] text-[var(--dash-text-muted)]">
              {new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="font-dash-condensed font-bold text-[17px] text-[var(--dash-text)] truncate leading-tight">
            {invoice.client?.name || 'No Client'}
          </div>
          {invoice.invoice_items?.length > 0 && (
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-0.5 truncate">
              {invoice.invoice_items.map(i => i.name).join(', ')}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="text-right flex-shrink-0 mr-2">
          <div className="font-dash-condensed font-bold text-xl text-[var(--dash-amber)]">
            ${invoice.total.toFixed(2)}
          </div>
          {invoice.status === 'unpaid' && remaining > 0 && remaining < invoice.total && (
            <div className="font-dash-mono text-[10px] text-[var(--dash-red)]">
              ${remaining.toFixed(2)} due
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {invoice.status === 'unpaid' && (
            <button
              onClick={() => onQuickPay(invoice.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--dash-green)] text-[var(--dash-black)] font-dash-condensed font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <DollarSign className="h-3 w-3" />
              Pay
            </button>
          )}
          <button
            onClick={() => onShare(invoice.id)}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
            title="Copy shareable link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onExportPDF(invoice.id)}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
            title="Export PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {hasModule ? (
            <button
              onClick={() => onEdit(invoice)}
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              disabled
              title="Enable Invoices module to edit"
              className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] opacity-40 cursor-not-allowed"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(invoice.id)}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-red)] hover:bg-[var(--dash-red)]/10 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 flex items-center justify-center text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border)] rounded transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded line items */}
      {expanded && invoice.invoice_items?.length > 0 && (
        <div className="border-t border-[var(--dash-border)] mx-4 mb-4">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_40px_80px_80px] gap-2 px-0 py-2 font-dash-mono text-[9px] uppercase tracking-[0.15em] text-[var(--dash-text-muted)] border-b border-[var(--dash-border)]">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
          </div>

          {/* Items */}
          {invoice.invoice_items.map((item, i) => (
            <div key={item.id || i} className="grid grid-cols-[1fr_40px_80px_80px] gap-2 py-2.5 border-b border-[var(--dash-border)] last:border-b-0">
              <div>
                <div className="font-dash-condensed font-semibold text-[14px] text-[var(--dash-text)]">{item.name}</div>
                {item.description && (
                  <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] mt-0.5">{item.description}</div>
                )}
              </div>
              <div className="font-dash-mono text-[12px] text-[var(--dash-text-dim)] text-center self-center">{item.quantity}</div>
              <div className="font-dash-mono text-[12px] text-[var(--dash-text-dim)] text-right self-center">${item.price.toFixed(2)}</div>
              <div className="font-dash-mono text-[12px] text-[var(--dash-text)] text-right self-center font-medium">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}

          {/* Totals */}
          <div className="pt-2 space-y-1">
            {invoice.discount_amount && invoice.discount_amount > 0 && (
              <>
                <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-green)]">
                  <span>Discount {invoice.discount_code ? `(${invoice.discount_code})` : ''}</span>
                  <span>-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-dash-condensed font-bold text-[15px] text-[var(--dash-text)] pt-1 border-t border-[var(--dash-border)]">
              <span>Total</span>
              <span className="text-[var(--dash-amber)]">${invoice.total.toFixed(2)}</span>
            </div>
            {invoice.paid_amount > 0 && invoice.status !== 'paid' && (
              <div className="flex justify-between font-dash-mono text-[11px] text-[var(--dash-red)]">
                <span>Remaining</span>
                <span>${remaining.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-3 pt-3 border-t border-[var(--dash-border)] font-dash-mono text-[11px] text-[var(--dash-text-muted)] italic">
              {invoice.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function InvoiceList({ invoices, hasModule }: { invoices: Invoice[]; hasModule: boolean }) {
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  async function handleExportPDF(invoiceId: string) {
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
      alert('PDF export coming soon!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to export PDF'
      alert(message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(id)
    } catch {
      alert('Failed to delete invoice')
    }
  }

  async function handleQuickPay(id: string) {
    if (!confirm('Mark this invoice as paid?')) return
    try {
      await markInvoiceAsPaid(id)
    } catch {
      alert('Failed to mark as paid')
    }
  }

  async function handleShare(id: string) {
    try {
      const url = await generateInvoiceShareToken(id)
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create share link')
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-6 py-16 text-center">
        <div className="font-dash-condensed font-bold text-base uppercase tracking-wider text-[var(--dash-text-muted)] mb-1">No Invoices Yet</div>
        <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Create your first invoice to get started</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
        {invoices.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            hasModule={hasModule}
            onEdit={setEditingInvoice}
            onDelete={handleDelete}
            onQuickPay={handleQuickPay}
            onExportPDF={handleExportPDF}
            onShare={handleShare}
          />
        ))}
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
