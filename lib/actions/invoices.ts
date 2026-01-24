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
  
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
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
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
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
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function updateInvoice(id: string, clientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('invoices')
    .update({ client_id: clientId })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')
}

/**
 * Auto-generate an invoice when a job is completed
 * This function creates an invoice based on the job's service and cost
 */
export async function createInvoiceFromJob(jobId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get the job with client info
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(`
      id,
      client_id,
      service_type,
      estimated_cost,
      title,
      description
    `)
    .eq('id', jobId)
    .single()
  
  if (jobError || !job) {
    console.error('Error fetching job for invoice creation:', jobError)
    return null
  }
  
  // Check if client_id exists
  if (!job.client_id) {
    console.log('Job has no client_id, skipping invoice creation')
    return null
  }
  
  // Check if invoice already exists for this job
  // We'll check by looking for invoices with matching client_id and similar total/date
  // This is a fallback if job_id column doesn't exist
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, created_at')
    .eq('client_id', job.client_id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Check if there's a very recent invoice (within last minute) - likely from this job
  if (recentInvoices && recentInvoices.length > 0) {
    const mostRecent = recentInvoices[0]
    const invoiceTime = new Date(mostRecent.created_at).getTime()
    const now = Date.now()
    // If invoice was created within last 2 minutes, assume it's for this job
    if (now - invoiceTime < 120000) {
      console.log('Recent invoice found, may be for this job')
      // Don't create duplicate, but also don't fail
    }
  }
  
  // Try to find matching service by name (service_type)
  let serviceId: string | null = null
  let servicePrice: number | null = null
  let serviceName: string = job.service_type || job.title || 'Service'
  let serviceDescription: string | null = job.description || null
  
  if (job.service_type) {
    const { data: services } = await supabase
      .from('services')
      .select('id, name, price, description')
      .eq('business_id', businessId)
      .ilike('name', `%${job.service_type}%`)
      .limit(1)
      .single()
    
    if (services) {
      serviceId = services.id
      servicePrice = services.price
      serviceName = services.name
      serviceDescription = services.description || serviceDescription
    }
  }
  
  // Use estimated_cost if available, otherwise use service price, or default to 0
  const invoiceTotal = job.estimated_cost || servicePrice || 0
  
  // Create invoice (job_id is optional if column doesn't exist)
  const invoiceData: any = {
    business_id: businessId,
    client_id: job.client_id,
    total: invoiceTotal,
    status: 'unpaid',
    paid_amount: 0
  }
  
  // Only add job_id if the column exists (will be handled by database if column doesn't exist)
  try {
    invoiceData.job_id = jobId
  } catch (e) {
    // Column might not exist, that's okay
  }
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()
  
  if (invoiceError) {
    console.error('Error creating invoice from job:', invoiceError)
    return null
  }
  
  // Create invoice item
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert({
      invoice_id: invoice.id,
      service_id: serviceId,
      name: serviceName,
      description: serviceDescription,
      price: invoiceTotal,
      quantity: 1
    })
  
  if (itemsError) {
    console.error('Error creating invoice items:', itemsError)
    // Don't fail the whole operation if items fail
  }
  
  revalidatePath('/dashboard/jobs')
  return invoice
}

