import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { AIWidget } from '@/components/booking/ai-widget'

export const dynamic = 'force-dynamic'

const RESERVED_SUBDOMAINS = new Set(['invite', 'dashboard', 'worker', 'api'])

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for public booking access')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default async function BookingSubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    notFound()
  }

  const supabase = getSupabaseClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select(
      'id, name, subdomain, logo_url, billing_plan, subscription_status, business_hours, accent_color'
    )
    .eq('subdomain', subdomain)
    .single()

  if (error || !business) {
    if (error?.code === 'PGRST116' || error?.message?.includes('JSON object')) {
      notFound()
    }
    console.error('[booking layout] business fetch:', error)
    notFound()
  }

  // Use select('*') — DB column is `price` (not base_price); duration is base_duration / estimated_duration (not duration_minutes)
  const { data: servicesRaw, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (servicesError?.message) {
    console.error('[booking layout] services fetch:', servicesError.message, servicesError.code)
  }

  const services = (servicesRaw || []).filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  )

  return (
    <>
      {children}
      <AIWidget
        business={{
          id: business.id,
          name: business.name,
          subdomain: business.subdomain,
          logo_url: business.logo_url,
          billing_plan: business.billing_plan,
          subscription_status: business.subscription_status,
          business_hours: business.business_hours,
          accent_color: business.accent_color,
        }}
        services={services}
      />
    </>
  )
}
