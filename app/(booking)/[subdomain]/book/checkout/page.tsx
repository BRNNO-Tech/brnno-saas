import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import CheckoutForm from '@/components/booking/checkout-form'

export const dynamic = 'force-dynamic'

async function getBusiness(subdomain: string) {
  // Use service role client to bypass RLS for public booking access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration for public booking access')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
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

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  // Always show checkout form - it will handle payment/no-payment cases
  // In mock mode or if no Stripe, the checkout form will show appropriate options
  return <CheckoutForm business={business} />
}
