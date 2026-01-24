'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'
import { calculateTotals, mapVehicleTypeToPricingKey } from '@/lib/utils/booking-utils'
import type { Service } from '@/types'

// Quick Quote Functions
type QuickQuoteData = {
  vehicleType: 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'crossover'
  vehicleCondition: string // Condition ID from business config (e.g., 'clean', 'moderate', 'heavy', 'extreme')
  services: string[] // Array of service IDs
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export async function createQuickQuote(data: QuickQuoteData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Get business with condition config
  const { data: business } = await supabase
    .from('businesses')
    .select('id, condition_config')
    .eq('owner_id', user.id)
    .single()
  
  if (!business) throw new Error('No business found')
  
  // Get full service data (needed for variable pricing)
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .in('id', data.services)
    .eq('business_id', business.id)
  
  if (!services || services.length === 0) {
    throw new Error('No services selected')
  }
  
  // Calculate total price using same logic as booking flow
  let totalPrice = 0
  let totalDuration = 0
  
  const conditionConfig = business.condition_config as {
    enabled: boolean
    tiers: Array<{
      id: string
      label: string
      description: string
      markup_percent: number
    }>
  } | null
  
  // Calculate totals for each service (same as booking)
  services.forEach((service: any) => {
    const totals = calculateTotals(
      service as Service,
      mapVehicleTypeToPricingKey(data.vehicleType),
      [], // No add-ons for quick quote
      data.vehicleCondition,
      conditionConfig
    )
    
    totalPrice += totals.price
    totalDuration += totals.duration
  })
  
  // Generate unique quote code with collision checking
  let quoteCode: string
  let attempts = 0
  const maxAttempts = 10
  
  try {
    const { data: codeResult, error: rpcError } = await supabase.rpc('generate_quote_code')
    if (rpcError || !codeResult) {
      // Fallback if RPC function doesn't exist or fails
      quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } else {
      quoteCode = codeResult
    }
  } catch {
    // Fallback if RPC function doesn't exist
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  
  // Check for duplicate quote_code and regenerate if needed
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('quote_code', quoteCode)
      .single()
    
    if (!existing) {
      break // Code is unique
    }
    
    // Regenerate code
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    attempts++
  }
  
  // Prepare insert data - only include fields that exist
  const insertData: any = {
    business_id: business.id,
    total_price: Math.round(totalPrice * 100) / 100,
    quote_code: quoteCode,
    status: 'draft', // Required field for compatibility
  }
  
  // Add optional fields only if they exist in the schema
  if (data.vehicleType) insertData.vehicle_type = data.vehicleType
  if (data.vehicleCondition) insertData.vehicle_condition = data.vehicleCondition
  if (data.services && data.services.length > 0) {
    // Convert array to JSONB format
    insertData.services = data.services
  }
  if (data.customerName) insertData.customer_name = data.customerName
  if (data.customerPhone) insertData.customer_phone = data.customerPhone
  if (data.customerEmail) insertData.customer_email = data.customerEmail
  
  // Create quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating quote:', error)
    console.error('Insert data:', insertData)
    throw new Error(`Failed to create quote: ${error.message}. Make sure you've run the database migration.`)
  }
  
  revalidatePath('/dashboard/quick-quote')
  return quote
}

export async function createQuoteForLead(
  leadId: string,
  data: QuickQuoteData & { leadId: string }
) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get business with condition config
  const { data: business } = await supabase
    .from('businesses')
    .select('id, condition_config')
    .eq('id', businessId)
    .single()
  
  if (!business) throw new Error('Business not found')

  // Get lead info to populate quote
  const { data: lead } = await supabase
    .from('leads')
    .select('name, email, phone, interested_in_service_id, estimated_value')
    .eq('id', leadId)
    .eq('business_id', businessId)
    .single()

  if (!lead) throw new Error('Lead not found')
  
  // Get full service data (needed for variable pricing)
  const serviceIds = data.services.length > 0 
    ? data.services 
    : (lead.interested_in_service_id ? [lead.interested_in_service_id] : [])
  
  if (serviceIds.length === 0) {
    throw new Error('No services selected')
  }
  
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .in('id', serviceIds)
    .eq('business_id', businessId)
  
  if (!services || services.length === 0) {
    throw new Error('No services found')
  }
  
  // Calculate total price using same logic as booking flow
  let totalPrice = 0
  let totalDuration = 0
  
  const conditionConfig = business.condition_config as {
    enabled: boolean
    tiers: Array<{
      id: string
      label: string
      description: string
      markup_percent: number
    }>
  } | null
  
  // Calculate totals for each service (same as booking)
  services.forEach((service: any) => {
    const totals = calculateTotals(
      service as Service,
      mapVehicleTypeToPricingKey(data.vehicleType),
      [], // No add-ons for quick quote
      data.vehicleCondition,
      conditionConfig
    )
    
    totalPrice += totals.price
    totalDuration += totals.duration
  })
  
  // Generate unique quote code
  let quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('quote_code', quoteCode)
      .single()
    
    if (!existing) break
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    attempts++
  }
  
  // Create quote (optionally linked to lead if column exists)
  const insertData: any = {
    business_id: businessId,
    total_price: Math.round(totalPrice * 100) / 100,
    quote_code: quoteCode,
    status: 'draft',
    vehicle_type: data.vehicleType,
    vehicle_condition: data.vehicleCondition,
    services: data.services.length > 0 ? data.services : (lead.interested_in_service_id ? [lead.interested_in_service_id] : []),
    customer_name: data.customerName || lead.name || null,
    customer_phone: data.customerPhone || lead.phone || null,
    customer_email: data.customerEmail || lead.email || null,
  }
  
  // Try to add lead_id - if column doesn't exist, Supabase will error but we'll handle it
  // User can add migration: ALTER TABLE quotes ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
  insertData.lead_id = leadId
  
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    // If error is about missing column, try without lead_id
    if (error.message?.includes('column') && error.message?.includes('lead_id')) {
      delete insertData.lead_id
      const { data: retryQuote, error: retryError } = await supabase
        .from('quotes')
        .insert(insertData)
        .select()
        .single()
      
      if (retryError) {
        console.error('Error creating quote for lead:', retryError)
        throw new Error(`Failed to create quote: ${retryError.message}`)
      }
      
      // Continue with quote creation (without lead_id link)
      const quote = retryQuote
      
      // Update lead status to 'quoted'
      await supabase
        .from('leads')
        .update({ status: 'quoted' })
        .eq('id', leadId)

      // Add interaction record
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: leadId,
          type: 'email',
          direction: 'outbound',
          content: `Quote sent: ${quote.quote_code}`,
          outcome: 'sent',
        })
      
      revalidatePath('/dashboard/leads')
      revalidatePath('/dashboard/leads/inbox')
      revalidatePath('/dashboard/quick-quote')
      
      return quote
    }
    
    console.error('Error creating quote for lead:', error)
    throw new Error(`Failed to create quote: ${error.message}`)
  }

  // Update lead status to 'quoted'
  await supabase
    .from('leads')
    .update({ status: 'quoted' })
    .eq('id', leadId)

  // Add interaction record
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      type: 'email',
      direction: 'outbound',
      content: `Quote sent: ${quoteCode}`,
      outcome: 'sent',
    })
  
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/leads/inbox')
  revalidatePath('/dashboard/quick-quote')
  
  return quote
}

export async function getQuickQuotes() {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  const { getMockQuotes } = await import('@/lib/demo/mock-data')
  
  if (await isDemoMode()) {
    return getMockQuotes()
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
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return quotes || []
}

export async function getQuoteByCode(code: string) {
  // Try authenticated client first, fall back to service role for public access
  let supabase
  try {
    supabase = await createClient()
    // Test if we have a valid session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // No authenticated user, use service role for public access
      throw new Error('No authenticated user')
    }
  } catch {
    // Use service role client for public quote access
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for public quote access')
    }
    
    supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      business:businesses(name, subdomain)
    `)
    .eq('quote_code', code)
    .single()
  
  if (error) throw error
  
  // Track view
  if (quote && !quote.viewed_at) {
    await supabase
      .from('quotes')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', quote.id)
  }
  
  return quote
}

