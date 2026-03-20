import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/service-client'

/**
 * Same persistence as recordPayment in lib/actions/invoices, but uses the
 * service client so Stripe webhooks can run without a user session.
 */
export async function recordInvoicePaymentFromStripeSession(
  invoiceId: string,
  amount: number,
  stripeSessionId: string
) {
  const supabase = createClient()
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceError) throw invoiceError
  if (!invoice) throw new Error('Invoice not found')

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('reference_number', stripeSessionId)
    .maybeSingle()

  if (existing) return

  const { error: paymentError } = await supabase.from('payments').insert({
    business_id: invoice.business_id,
    invoice_id: invoiceId,
    amount,
    payment_method: 'card',
    reference_number: stripeSessionId,
    notes: null,
  })

  if (paymentError) throw paymentError

  const newPaidAmount = Number(invoice.paid_amount || 0) + amount
  const newStatus = newPaidAmount >= Number(invoice.total) ? 'paid' : 'unpaid'

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq('id', invoiceId)

  if (updateError) throw updateError

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}
