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

export async function getCustomersWithStats() {
  if (await isDemoMode()) {
    const { getMockClients } = await import('@/lib/demo/mock-data')
    const mockClients = getMockClients()
    
    // Calculate stats for each mock client (same logic as real mode)
    const clientsWithStats = mockClients.map((client: any) => {
      const jobs = client.jobs || []
      const completedJobs = jobs.filter((j: any) => j.status === 'completed')
      const totalRevenue = completedJobs.reduce((sum: number, j: any) => sum + (j.estimated_cost || 0), 0)
      
      // Find most recent job
      const sortedJobs = jobs.sort((a: any, b: any) => 
        new Date(b.scheduled_date || b.created_at).getTime() - new Date(a.scheduled_date || a.created_at).getTime()
      )
      const lastJob = sortedJobs[0]
      
      return {
        ...client,
        stats: {
          totalJobs: jobs.length,
          completedJobs: completedJobs.length,
          totalRevenue,
          lastJobDate: lastJob ? (lastJob.scheduled_date || lastJob.created_at) : null
        }
      }
    })
    
    return clientsWithStats
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  
  if (!business) throw new Error('No business found')
  
  // Get clients with their jobs
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      jobs (
        id,
        status,
        estimated_cost,
        scheduled_date,
        created_at
      )
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Calculate stats for each client
  const clientsWithStats = (clients || []).map((client: any) => {
    const jobs = client.jobs || []
    const completedJobs = jobs.filter((j: any) => j.status === 'completed')
    const totalRevenue = completedJobs.reduce((sum: number, j: any) => sum + (j.estimated_cost || 0), 0)
    
    // Find most recent job
    const sortedJobs = jobs.sort((a: any, b: any) => 
      new Date(b.scheduled_date || b.created_at).getTime() - new Date(a.scheduled_date || a.created_at).getTime()
    )
    const lastJob = sortedJobs[0]
    
    return {
      ...client,
      stats: {
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        totalRevenue,
        lastJobDate: lastJob ? (lastJob.scheduled_date || lastJob.created_at) : null
      }
    }
  })
  
  return clientsWithStats
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
  
  revalidatePath('/dashboard/customers')
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
  
  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/customers')
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
              licensePlate: job.asset_details.licensePlate || (job.asset_details as any).license_plate || null,
              vin: (job.asset_details as any).vin || null,
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
    
    // Log the full error object for debugging
    console.error('Error fetching client:', {
      code: clientError.code,
      message: clientError.message,
      details: clientError.details,
      hint: clientError.hint,
      fullError: clientError
    })
    
    // Create a proper Error object with all details
    const errorMessage = clientError.message || 'Failed to fetch client'
    const error = new Error(errorMessage)
    ;(error as any).code = clientError.code
    ;(error as any).details = clientError.details
    ;(error as any).hint = clientError.hint
    throw error
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
  let invoices: any[] | null = null
  let invoicesError: any = null
  
  try {
    const result = await supabase
      .from('invoices')
      .select('id, total, status, created_at')
      .eq('client_id', id)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    
    invoices = result.data
    invoicesError = result.error
    
    // Early check: if we got data (even empty array), ignore any error completely
    // Supabase sometimes returns empty error objects when query succeeds
    if (invoices !== null && invoices !== undefined) {
      invoicesError = null
      // Skip all error processing if we have data
    } else if (invoicesError) {
      // Only process error if we don't have data AND we have an error
      // Check if error is truly empty (no enumerable properties and no message/code)
      if (typeof invoicesError === 'object' && invoicesError !== null) {
        const errorKeys = Object.keys(invoicesError)
        const hasEnumerableProps = errorKeys.length > 0
        
        // Check for non-enumerable properties that might exist
        const hasMessage = 'message' in invoicesError && (invoicesError as any).message
        const hasCode = 'code' in invoicesError && (invoicesError as any).code
        const hasDetails = 'details' in invoicesError && (invoicesError as any).details
        const hasHint = 'hint' in invoicesError && (invoicesError as any).hint
        
        // If error object is empty and has no meaningful properties, treat as false positive
        if (!hasEnumerableProps && !hasMessage && !hasCode && !hasDetails && !hasHint) {
          invoicesError = null
        }
      } else if (invoicesError instanceof Error) {
        // For Error instances, check if message exists
        if (!invoicesError.message || invoicesError.message.trim().length === 0) {
          invoicesError = null
        }
      }
    }
    
    // Only log if there's a real error with meaningful content
    // Ignore empty error objects (false positives from Supabase)
    // Skip entirely if we already cleared the error (we have data)
    if (!invoicesError) {
      // Error was cleared because we have data, skip all processing
    } else if (invoicesError) {
      // Check if error object has any meaningful properties
      let hasRealError = false
      let errorMessage: string | null = null
      let errorCode: string | null = null
      
      if (invoicesError instanceof Error) {
        // Error instances have non-enumerable properties, extract them explicitly
        errorMessage = invoicesError.message || null
        errorCode = (invoicesError as any).code || (invoicesError as any).statusCode || null
        hasRealError = !!errorMessage && errorMessage.trim().length > 0
      } else if (typeof invoicesError === 'object' && invoicesError !== null) {
        // Check if object has any enumerable properties
        const keys = Object.keys(invoicesError)
        if (keys.length === 0) {
          // Empty object - definitely a false positive
          hasRealError = false
          invoicesError = null // Clear the error immediately
        } else {
          // Extract properties that might be non-enumerable
          errorMessage = (invoicesError as any).message || 
                        (invoicesError as any).error?.message || 
                        (invoicesError as any).msg || 
                        null
          errorCode = (invoicesError as any).code || 
                     (invoicesError as any).statusCode || 
                     (invoicesError as any).error?.code || 
                     null
          
          // Also check for Supabase-specific error properties
          const details = (invoicesError as any).details || null
          const hint = (invoicesError as any).hint || null
          
          // Check if we have meaningful error content
          const hasMessage = Boolean(errorMessage && String(errorMessage).trim().length > 0)
          const hasCode = Boolean(errorCode && String(errorCode).trim().length > 0)
          const hasDetails = Boolean(details && String(details).trim().length > 0)
          const hasHint = Boolean(hint && String(hint).trim().length > 0)
          hasRealError = hasMessage || hasCode || hasDetails || hasHint
          
          // If object only has empty/undefined values, treat as false positive
          if (!hasRealError) {
            const hasAnyValue = keys.some(key => {
              const value = (invoicesError as any)[key]
              return value !== null && value !== undefined && value !== ''
            })
            if (!hasAnyValue) {
              hasRealError = false
              invoicesError = null // Clear the error
            }
          }
        }
      }
      
      // Only log if we have a real error with meaningful content
      if (hasRealError) {
        // Extract all possible error properties directly from the error object
        const details = (invoicesError as any).details || null
        const hint = (invoicesError as any).hint || null
        
        // Extract all error properties and build error info
        const errorInfo: any = {}
        let hasAnyErrorInfo = false
        
        if (id) errorInfo.clientId = id
        if (businessId) errorInfo.businessId = businessId
        
        if (errorCode && String(errorCode).trim().length > 0) {
          errorInfo.code = errorCode
          hasAnyErrorInfo = true
        }
        if (errorMessage && String(errorMessage).trim().length > 0) {
          errorInfo.message = errorMessage
          hasAnyErrorInfo = true
        }
        if (details && String(details).trim().length > 0) {
          errorInfo.details = details
          hasAnyErrorInfo = true
        }
        if (hint && String(hint).trim().length > 0) {
          errorInfo.hint = hint
          hasAnyErrorInfo = true
        }
        
        // Only log if we have meaningful error information (not just IDs)
        if (hasAnyErrorInfo) {
          // Explicitly log the fields we extracted
          console.error('Invoice query error:', errorInfo)
        } else {
          // No meaningful error details found, treat as false positive
          // Don't log empty objects
          invoicesError = null
        }
      } else {
        // If no meaningful error, treat as no error (likely false positive)
        invoicesError = null
      }
    }
  } catch (catchError) {
    console.error('Exception during invoice query:', {
      error: catchError instanceof Error ? catchError.message : String(catchError),
      clientId: id,
      businessId: businessId
    })
    invoicesError = catchError as any
  }
  
  // Final check: if we have data, clear any error (likely false positive)
  // This is redundant but ensures we never have an error when we have data
  if (invoices) {
    invoicesError = null
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

