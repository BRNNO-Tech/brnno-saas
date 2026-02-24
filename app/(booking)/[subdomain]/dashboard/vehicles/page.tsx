import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import VehiclesManager from '@/components/booking/vehicles-manager'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for public booking access')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

async function getBusiness(subdomain: string) {
  const supabase = getSupabaseClient()
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, subdomain')
    .eq('subdomain', subdomain)
    .single()
  if (error && (error.code === 'PGRST116' || error.message?.includes('JSON object'))) return null
  if (error) {
    console.error('Error fetching business:', error)
    return null
  }
  return business
}

export default async function VehiclesPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)
  if (!business) notFound()

  return (
    <VehiclesManager
      businessId={business.id}
      subdomain={subdomain}
    />
  )
}
