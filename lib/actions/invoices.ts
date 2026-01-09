'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockInvoices } from '@/lib/demo/mock-data'

export async function getInvoices() {
  if (await isDemoMode()) {
    return getMockInvoices()
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(name),
      invoice_items(*),
      payments(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return invoices || []
}


export async function addInvoice(clientId: string, items: Array<{ service_id: string, name: string, description?: string, price: number, quantity: number }>) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      client_id: clientId,
      total,
      status: 'unpaid',
      paid_amount: 0
    })
    .select()
    .single()
  
  if (invoiceError) throw invoiceError
  
  // Create invoice items
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    service_id: item.service_id,
    name: item.name,
    description: item.description || null,
    price: item.price,
    quantity: item.quantity
  }))
  
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems)
  
  if (itemsError) throw itemsError
  
  revalidatePath('/dashboard/invoices')
  return invoice
}

export async function recordPayment(invoiceId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get current invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()
  
  if (invoiceError) throw invoiceError
  
  // Record payment
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      business_id: businessId,
      invoice_id: invoiceId,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null
    })
  
  if (paymentError) throw paymentError
  
  // Update invoice paid amount and status
  const newPaidAmount = (invoice.paid_amount || 0) + amount
  const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'unpaid'
  
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus
    })
    .eq('id', invoiceId)
  
  if (updateError) throw updateError
  
  revalidatePath('/dashboard/invoices')
}

export async function markInvoiceAsPaid(invoiceId: string) {
  const supabase = await createClient()
  
  // Get invoice total
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, paid_amount')
    .eq('id', invoiceId)
    .single()
  
  if (!invoice) throw new Error('Invoice not found')
  
  const remainingAmount = invoice.total - (invoice.paid_amount || 0)
  
  // Record full payment
  await recordPayment(invoiceId, remainingAmount, 'Cash', undefined, 'Quick payment')
  
  revalidatePath('/dashboard/invoices')
}

export async function updateInvoice(id: string, clientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('invoices')
    .update({ client_id: clientId })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/invoices')
}

