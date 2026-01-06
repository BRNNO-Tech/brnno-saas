'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getClients() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, notes, created_at, updated_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return clients || []
}

export async function addClient(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const clientData = {
    business_id: businessId,
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
  }
  
  const { error } = await supabase
    .from('clients')
    .insert(clientData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const clientData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
  }
  
  const { error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  if (!id) {
    throw new Error('Client ID is required')
  }
  
  // Get client info
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single()
  
  if (clientError) {
    // Handle "no rows" error specifically
    if (clientError.code === 'PGRST116' || clientError.message?.includes('JSON object')) {
      throw new Error('Client not found')
    }
    console.error('Error fetching client:', {
      code: clientError.code,
      message: clientError.message,
      details: clientError.details,
      hint: clientError.hint
    })
    throw new Error(`Failed to fetch client: ${clientError.message}`)
  }
  
  if (!client) {
    throw new Error('Client not found')
  }
  
  // Get all jobs for this client
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, status, scheduled_date, estimated_cost, estimated_duration, created_at')
    .eq('client_id', id)
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: false })
  
  if (jobsError) {
    // Safely log error without accessing potentially undefined properties
    try {
      console.error('Error fetching client jobs:', {
        code: jobsError.code || 'unknown',
        message: jobsError.message || String(jobsError),
        details: jobsError.details || null,
        hint: jobsError.hint || null,
        clientId: id
      })
    } catch (logError) {
      // If logging fails, just log the error as string
      console.error('Error fetching client jobs (could not serialize):', String(jobsError))
    }
    // Don't throw - just use empty array
  }
  
  // Get all invoices for this client
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, status, created_at, due_date')
    .eq('client_id', id)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (invoicesError) {
    // Safely log error without accessing potentially undefined properties
    try {
      console.error('Error fetching client invoices:', {
        code: invoicesError.code || 'unknown',
        message: invoicesError.message || String(invoicesError),
        details: invoicesError.details || null,
        hint: invoicesError.hint || null,
        clientId: id
      })
    } catch (logError) {
      // If logging fails, just log the error as string
      console.error('Error fetching client invoices (could not serialize):', String(invoicesError))
    }
    // Don't throw - just use empty array
  }
  
  // Calculate stats
  const jobsArray = jobs || []
  const invoicesArray = invoices || []
  
  const totalJobs = jobsArray.length
  const completedJobs = jobsArray.filter(j => j.status === 'completed').length
  const totalRevenue = invoicesArray.reduce((sum, inv) => {
    if (inv.status === 'paid') return sum + (inv.total || 0)
    return sum
  }, 0)
  const outstandingBalance = invoicesArray.reduce((sum, inv) => {
    if (inv.status === 'unpaid' || inv.status === 'overdue') return sum + (inv.total || 0)
    return sum
  }, 0)
  const averageJobValue = completedJobs > 0 
    ? jobsArray
        .filter(j => j.status === 'completed' && j.estimated_cost)
        .reduce((sum, j) => sum + (j.estimated_cost || 0), 0) / completedJobs
    : 0
  
  const lastJob = jobsArray.length > 0 ? jobsArray[0] : null
  
  return {
    ...client,
    jobs: jobsArray,
    invoices: invoicesArray,
    stats: {
      totalJobs,
      completedJobs,
      totalRevenue,
      outstandingBalance,
      averageJobValue,
      lastJobDate: lastJob?.scheduled_date || null,
      isRepeatClient: totalJobs > 1
    }
  }
}

