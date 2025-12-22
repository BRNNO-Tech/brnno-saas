'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getQuotes() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      *,
      client:clients(name),
      quote_items(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return quotes || []
}


export async function addQuote(clientId: string, items: Array<{ service_id: string, name: string, description?: string, price: number, quantity: number }>) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Create quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      business_id: businessId,
      client_id: clientId,
      total,
      status: 'draft'
    })
    .select()
    .single()
  
  if (quoteError) throw quoteError
  
  // Create quote items
  const quoteItems = items.map(item => ({
    quote_id: quote.id,
    service_id: item.service_id,
    name: item.name,
    description: item.description || null,
    price: item.price,
    quantity: item.quantity
  }))
  
  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(quoteItems)
  
  if (itemsError) throw itemsError
  
  revalidatePath('/dashboard/quotes')
  return quote
}

export async function updateQuoteStatus(id: string, status: 'draft' | 'sent' | 'approved') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/quotes')
}

export async function updateQuote(id: string, clientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('quotes')
    .update({ client_id: clientId })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/quotes')
}

export async function deleteQuote(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/quotes')
}

export async function convertQuoteToInvoice(quoteId: string) {
  const supabase = await createClient()
  
  // Get quote with items
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_items(*)
    `)
    .eq('id', quoteId)
    .single()
  
  if (quoteError) throw quoteError
  
  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      business_id: quote.business_id,
      client_id: quote.client_id,
      quote_id: quote.id,
      total: quote.total,
      status: 'unpaid'
    })
    .select()
    .single()
  
  if (invoiceError) throw invoiceError
  
  // Create invoice items from quote items
  const invoiceItems = quote.quote_items.map((item: any) => ({
    invoice_id: invoice.id,
    service_id: item.service_id,
    name: item.name,
    description: item.description,
    price: item.price,
    quantity: item.quantity
  }))
  
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems)
  
  if (itemsError) throw itemsError
  
  // Update quote status to approved
  await updateQuoteStatus(quoteId, 'approved')
  
  revalidatePath('/dashboard/quotes')
  revalidatePath('/dashboard/invoices')
  
  return invoice
}

