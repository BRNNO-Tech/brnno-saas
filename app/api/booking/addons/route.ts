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

    console.log('[addons API] Request received for businessId:', businessId)

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    const { data: addons, error } = await supabase
      .from('service_addons')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('sort_order')

    console.log('[addons API] Query result:', { 
      addonsCount: addons?.length || 0, 
      error: error?.message,
      businessId 
    })

    if (error) {
      console.error('[addons API] Database error:', error)
      throw error
    }

    const result = { addons: addons || [] }
    console.log('[addons API] Returning:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[addons API] Error fetching add-ons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch add-ons', details: error.message },
      { status: 500 }
    )
  }
}
