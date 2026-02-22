import { notFound, redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerDashboard from '@/components/booking/customer-dashboard'
import { BookingLanguageSwitcher } from '@/components/booking/booking-language-switcher'
import { getCustomerBookingTranslations, type CustomerBookingLang } from '@/lib/translations/customer-booking'
import type { CustomerBookingRow } from '@/components/booking/customer-dashboard'

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
    .select('id, name, subdomain, email, phone')
    .eq('subdomain', subdomain)
    .single()
  if (error && (error.code === 'PGRST116' || error.message?.includes('JSON object'))) return null
  if (error) {
    console.error('Error fetching business:', error)
    return null
  }
  return business
}

const JOB_SELECT = `
  id,
  created_at,
  service_type,
  scheduled_date,
  address,
  city,
  state,
  zip,
  status,
  estimated_cost,
  asset_details,
  client:clients(name, phone, email),
  assignments:job_assignments(
    id,
    team_member:team_members!job_assignments_team_member_id_fkey(id, name, phone)
  )
`

async function getCustomerBookingsByUserId(businessId: string, userId: string): Promise<CustomerBookingRow[]> {
  const supabase = getSupabaseClient()
  const { data: clientRows } = await supabase
    .from('clients')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
  const clientIds = (clientRows || []).map((c) => c?.id).filter(Boolean) as string[]
  if (clientIds.length === 0) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('business_id', businessId)
    .in('client_id', clientIds)
    .order('scheduled_date', { ascending: false })

  const allJobs = (jobs || []) as CustomerBookingRow[]
  allJobs.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
  return allJobs
}

export default async function CustomerDashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { subdomain } = await params
  const resolved = await searchParams
  const lang: 'en' | 'es' = resolved.lang === 'es' ? 'es' : 'en'
  const t = getCustomerBookingTranslations(lang as CustomerBookingLang)

  if (subdomain === 'invite' || subdomain === 'dashboard' || subdomain === 'worker' || subdomain === 'api') {
    notFound()
  }

  const business = await getBusiness(subdomain)
  if (!business) notFound()

  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  if (!user) {
    redirect(`/sign-in?subdomain=${encodeURIComponent(subdomain)}&next=${encodeURIComponent(`/${subdomain}/dashboard`)}`)
  }

  const bookings = await getCustomerBookingsByUserId(business.id, user.id)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-14 pr-28 sm:pr-32">
      <div className="fixed top-4 right-4 z-50">
        <BookingLanguageSwitcher subdomain={subdomain} path="/dashboard" query={{}} lang={lang} />
      </div>
      <CustomerDashboard
        businessName={business.name}
        subdomain={subdomain}
        email={user.email ?? undefined}
        bookings={bookings}
        lang={lang}
        t={t}
        isLoggedIn={true}
      />
    </div>
  )
}
