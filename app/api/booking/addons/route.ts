import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')

    console.log('[addons API] Request received for businessId:', businessId, 'serviceId:', serviceId)

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Query for service-specific add-ons first
    // If service_id column exists and serviceId is provided, filter by it
    // Also include business-wide add-ons (where service_id is NULL) as fallback
    let addons: any[] = []
    
    if (serviceId) {
      // Try to get service-specific add-ons first
      const serviceSpecificQuery = supabase
        .from('service_addons')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .eq('service_id', serviceId)
        .order('name', { ascending: true })
      
      const { data: serviceAddons, error: serviceError } = await serviceSpecificQuery
      
      if (!serviceError && serviceAddons) {
        addons = serviceAddons
        console.log('[addons API] Found', addons.length, 'service-specific add-ons')
      } else if (serviceError?.code === '42703') {
        // Column doesn't exist, fall through to business-wide query
        console.log('[addons API] service_id column does not exist, querying all business add-ons')
      } else {
        console.error('[addons API] Error querying service-specific add-ons:', serviceError)
      }
      
      // If we have service-specific add-ons, also include business-wide ones (service_id IS NULL)
      // This allows businesses to have both service-specific and general add-ons
      const businessWideQuery = supabase
        .from('service_addons')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .is('service_id', null)
        .order('name', { ascending: true })
      
      const { data: businessAddons, error: businessError } = await businessWideQuery
      
      if (!businessError && businessAddons) {
        // Merge service-specific and business-wide add-ons, avoiding duplicates
        const existingIds = new Set(addons.map(a => a.id))
        const newAddons = businessAddons.filter(a => !existingIds.has(a.id))
        addons = [...addons, ...newAddons]
        console.log('[addons API] Added', newAddons.length, 'business-wide add-ons')
      } else if (businessError?.code !== '42703') {
        // Only log if it's not a column error (which we already handled above)
        console.error('[addons API] Error querying business-wide add-ons:', businessError)
      }
    } else {
      // No serviceId provided, just get all business add-ons
      const allAddonsQuery = supabase
        .from('service_addons')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      const { data: allAddons, error: allError } = await allAddonsQuery
      
      if (allError) {
        throw allError
      }
      
      addons = allAddons || []
    }

    // For backward compatibility, if no addons found and service_id column might not exist,
    // try a simple query without service_id filter
    if (addons.length === 0 && serviceId) {
      console.log('[addons API] No add-ons found with service_id filter, trying fallback query')
      const fallbackQuery = supabase
        .from('service_addons')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      const { data: fallbackAddons, error: fallbackError } = await fallbackQuery
      
      if (!fallbackError && fallbackAddons) {
        addons = fallbackAddons
        console.log('[addons API] Fallback query found', addons.length, 'add-ons')
      }
    }

    console.log('[addons API] Query result:', { 
      addonsCount: addons?.length || 0, 
      businessId,
      serviceId
    })

    // Deduplicate add-ons by ID (in case of any duplicates)
    const uniqueAddons = (addons || []).filter((addon, index, self) =>
      index === self.findIndex((a) => a.id === addon.id)
    )

    const result = { addons: uniqueAddons }
    console.log('[addons API] Returning:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[addons API] Error fetching add-ons:', error)
    const errorMessage = error?.message || 'Unknown error occurred'
    const errorDetails = error?.details || error?.hint || null
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch add-ons', 
        details: errorMessage,
        ...(errorDetails && { hint: errorDetails })
      },
      { status: 500 }
    )
  }
}
