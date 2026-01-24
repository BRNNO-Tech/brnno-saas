import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BookingLanding from '@/components/booking/booking-landing'
import { createClient } from '@supabase/supabase-js'

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
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    // Check if it's a "no rows" error
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

async function getServices(businessId: string) {
  const supabase = getSupabaseClient()

  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true) // Only get active services
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  // Deduplicate by ID (in case of any duplicates)
  const uniqueServices = (services || []).filter((service, index, self) =>
    index === self.findIndex((s) => s.id === service.id)
  )

  return uniqueServices
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)

  if (!business) {
    return {
      title: 'Booking Not Found',
      description: 'This booking page could not be found.'
    }
  }

  const title = `${business.name} | Book Now`
  const description = business.description || `Book an appointment with ${business.name}.`
  const imageUrl = business.logo_url || business.booking_banner_url || undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    }
  }
}

export default async function BookingPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  // Don't handle reserved routes
  if (subdomain === 'invite' || subdomain === 'dashboard' || subdomain === 'worker' || subdomain === 'api') {
    notFound()
  }

  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  const services = await getServices(business.id)

  return <BookingLanding business={business} services={services} />
}
