import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)
  if (!business) notFound()

  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {user && (
        <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-6 text-sm font-medium">
              <Link
                href={`/${subdomain}/dashboard`}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                My Account
              </Link>
              <Link
                href={`/${subdomain}/dashboard/vehicles`}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Vehicles
              </Link>
              <Link
                href={`/${subdomain}/dashboard/addresses`}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Addresses
              </Link>
            </div>
          </div>
        </nav>
      )}
      {children}
    </div>
  )
}
