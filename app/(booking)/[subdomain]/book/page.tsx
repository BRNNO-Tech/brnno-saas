import { notFound, redirect } from 'next/navigation'
import BookingForm from '@/components/booking/booking-form'
import { createClient } from '@supabase/supabase-js'
import { getQuoteByCode } from '@/lib/actions/quotes'

export const dynamic = 'force-dynamic'

// Create service role client for public booking access
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for public booking access')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function getBusiness(subdomain: string) {
  const supabase = getSupabaseClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*, condition_config')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

async function hasAIPhotoAnalysis(businessId: string, ownerId?: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  // Check if business owner is an admin
  if (ownerId) {
    try {
      // Use Supabase Admin API to get user email
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${ownerId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
        }
      )
      
      if (response.ok) {
        const userData = await response.json()
        const ownerEmail = userData?.email
        
        if (ownerEmail) {
          const ADMIN_EMAILS = [
            'john@brnno.com',
            'adrian@brnno.com',
            'sam@brnno.com',
            'skylar@brnno.com',
            'austin@brnno.com',
            'brandon@brnno.com',
          ]
          
          if (ADMIN_EMAILS.includes(ownerEmail.toLowerCase())) {
            return true // Admins get free access
          }
        }
      }
    } catch (error) {
      // If we can't check admin status, continue to check subscription addon
      console.error('Error checking admin status:', error)
    }
  }
  
  // Check for subscription addon
  const { data, error } = await supabase
    .from('business_subscription_addons')
    .select('id, status, trial_ends_at')
    .eq('business_id', businessId)
    .eq('addon_key', 'ai_photo_analysis')
    .in('status', ['active', 'trial'])
    .single()

  if (error || !data) {
    return false
  }

  // If it's a trial, check if it's still valid
  if (data.status === 'trial') {
    const now = new Date()
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null
    return trialEndsAt !== null && trialEndsAt >= now
  }

  return true
}

async function getService(serviceId: string, businessId: string) {
  const supabase = getSupabaseClient()

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .eq('is_active', true) // Only get active services
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching service:', error)
    return null
  }

  return service
}

export default async function BookPage({
  params,
  searchParams
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ service?: string, quote?: string }>
}) {
  const { subdomain } = await params
  const { service: serviceId, quote: quoteCode } = await searchParams

  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  // If quote code provided, get quote details
  let quoteData = null
  if (quoteCode) {
    try {
      quoteData = await getQuoteByCode(quoteCode.toUpperCase())
      // Verify quote belongs to this business
      if (quoteData && quoteData.business_id !== business.id) {
        quoteData = null // Quote doesn't belong to this business
      }
    } catch (error) {
      // Quote not found, continue without it
      console.error('Error fetching quote:', error)
    }
  }

  // If quote provided but no service ID, get first service from quote or create a placeholder
  let service = null
  if (quoteData && !serviceId) {
    // If quote has services array, get the first service
    if (quoteData.services && Array.isArray(quoteData.services) && quoteData.services.length > 0) {
      const firstServiceId = quoteData.services[0]
      service = await getService(firstServiceId, business.id)
    }
    
    // If still no service, create a placeholder service for the quote
    if (!service) {
      service = {
        id: 'quote-service',
        name: 'Custom Quote Service',
        description: `Quote ${quoteData.quote_code}`,
        price: quoteData.total_price || quoteData.total || 0,
        duration_minutes: 60, // Default duration
        is_popular: false,
      }
    }
  } else if (serviceId) {
    // Normal flow: get service by ID
    service = await getService(serviceId, business.id)
  }

  // If no service and no quote, redirect back to landing page
  if (!service && !quoteData) {
    redirect(`/${subdomain}`)
  }

  // If service doesn't exist and we have a quote, create placeholder
  if (!service && quoteData) {
    service = {
      id: 'quote-service',
      name: 'Custom Quote Service',
      description: `Quote ${quoteData.quote_code}`,
      price: quoteData.total_price || quoteData.total || 0,
      duration_minutes: 60,
      is_popular: false,
    }
  }

  // If service doesn't exist or doesn't belong to this business (and not a quote), redirect
  if (!service && !quoteData) {
    redirect(`/${subdomain}`)
  }

  // Check if business has AI photo analysis (check admin status and subscription addon)
  const hasAI = await hasAIPhotoAnalysis(business.id, business.owner_id)

  return <BookingForm business={business} service={service!} quote={quoteData} hasAIPhotoAnalysis={hasAI} />
}
