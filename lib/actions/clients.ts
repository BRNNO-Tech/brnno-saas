'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { MOCK_CLIENTS, getMockClients } from '@/lib/demo/mock-data'

export async function getClients() {
  if (await isDemoMode()) {
    return MOCK_CLIENTS
  }

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
  if (await isDemoMode()) {
    const { getMockClients } = await import('@/lib/demo/mock-data')
    const mockClients = getMockClients()
    const client = mockClients.find(c => c.id === id)
    if (!client) {
      throw new Error('Client not found')
    }
    
    // Calculate stats for demo mode (same logic as real mode)
    const jobsArray = (client.jobs || []).sort((a, b) => {
      if (!a.scheduled_date && !b.scheduled_date) return 0
      if (!a.scheduled_date) return 1
      if (!b.scheduled_date) return -1
      return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    })
    const invoicesArray = client.invoices || []
    
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
    
    // Extract unique vehicles from jobs
    const vehicles = new Map<string, any>()
    jobsArray.forEach(job => {
      if (job.asset_details && typeof job.asset_details === 'object') {
        // For vehicle-based businesses (detailing, etc.)
        if (job.asset_details.make && job.asset_details.model) {
          const key = `${job.asset_details.make}-${job.asset_details.model}-${job.asset_details.year || ''}-${job.asset_details.color || ''}`.toLowerCase()
          if (!vehicles.has(key)) {
            vehicles.set(key, {
              make: job.asset_details.make,
              model: job.asset_details.model,
              year: job.asset_details.year || null,
              color: job.asset_details.color || null,
              licensePlate: job.asset_details.licensePlate || job.asset_details.license_plate || null,
              vin: job.asset_details.vin || null,
              jobCount: 0,
              lastServiceDate: job.scheduled_date
            })
          }
          const vehicle = vehicles.get(key)!
          vehicle.jobCount++
          if (job.scheduled_date && (!vehicle.lastServiceDate || new Date(job.scheduled_date) > new Date(vehicle.lastServiceDate))) {
            vehicle.lastServiceDate = job.scheduled_date
          }
        }
      }
    })
    
    return {
      ...client,
      jobs: jobsArray,
      invoices: invoicesArray,
      vehicles: Array.from(vehicles.values()),
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
  
  // Get all jobs for this client (including asset_details for vehicles)
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, status, scheduled_date, estimated_cost, estimated_duration, created_at, asset_details')
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
  let invoices = null
  let invoicesError = null
  
  try {
    const result = await supabase
      .from('invoices')
      .select('id, total, status, created_at, due_date')
      .eq('client_id', id)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    
    invoices = result.data
    invoicesError = result.error
    
    // Check if error is actually meaningful (not just an empty object)
    const hasRealError = invoicesError && (
      (typeof invoicesError === 'object' && invoicesError !== null && !Array.isArray(invoicesError) && Object.keys(invoicesError).length > 0) ||
      (typeof invoicesError === 'string' && (invoicesError as string).length > 0) ||
      (invoicesError instanceof Error)
    )
    
    // Only log if there's a real error, or if we got no data and an error exists
    if (hasRealError || (invoicesError && !invoices)) {
      console.error('Invoice query issue:', {
        hasData: !!result.data,
        dataLength: result.data?.length,
        hasError: !!result.error,
        errorIsEmpty: invoicesError && typeof invoicesError === 'object' && Object.keys(invoicesError).length === 0,
        errorType: typeof result.error,
        errorConstructor: result.error?.constructor?.name,
        errorString: String(result.error),
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        clientId: id,
        businessId: businessId,
        // Try to get all properties
        errorProps: result.error ? Object.getOwnPropertyNames(result.error) : []
      })
    }
    
    // If we have data, ignore empty error objects (likely false positive)
    if (invoices && !hasRealError) {
      invoicesError = null // Clear the false positive error
    }
  } catch (catchError) {
    console.error('Exception during invoice query:', {
      error: catchError,
      errorType: typeof catchError,
      errorMessage: catchError instanceof Error ? catchError.message : String(catchError),
      clientId: id,
      businessId: businessId
    })
    invoicesError = catchError as any
  }
  
  if (invoicesError && invoices === null) {
    // Only warn if we actually failed to get data
    console.warn('Invoice fetch failed, using empty array.')
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
  
  // Extract unique vehicles from jobs
  const vehicles = new Map<string, any>()
  jobsArray.forEach(job => {
    if (job.asset_details && typeof job.asset_details === 'object') {
      // For vehicle-based businesses (detailing, etc.)
      if (job.asset_details.make && job.asset_details.model) {
        const key = `${job.asset_details.make}-${job.asset_details.model}-${job.asset_details.year || ''}-${job.asset_details.color || ''}`.toLowerCase()
        if (!vehicles.has(key)) {
          vehicles.set(key, {
            make: job.asset_details.make,
            model: job.asset_details.model,
            year: job.asset_details.year || null,
            color: job.asset_details.color || null,
            licensePlate: job.asset_details.licensePlate || job.asset_details.license_plate || null,
            vin: job.asset_details.vin || null,
            jobCount: 0,
            lastServiceDate: job.scheduled_date
          })
        }
        const vehicle = vehicles.get(key)!
        vehicle.jobCount++
        if (job.scheduled_date && (!vehicle.lastServiceDate || new Date(job.scheduled_date) > new Date(vehicle.lastServiceDate))) {
          vehicle.lastServiceDate = job.scheduled_date
        }
      }
    }
  })
  
  return {
    ...client,
    jobs: jobsArray,
    invoices: invoicesArray,
    vehicles: Array.from(vehicles.values()),
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

