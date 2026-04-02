import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import BrnnoV2 from '@/components/landing/brnno-v2'

export default async function Home() {
  // Check domain
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isAppDomain = host === 'app.brnno.io' || host.startsWith('app.brnno.io:')
  
  // If on app.brnno.io, redirect to login (middleware should handle this, but as a fallback)
  if (isAppDomain) {
    redirect('/login')
  }
  
  // On marketing domain (e.g. brnno.com): if auth fails (env, Supabase, cookies), still show landing
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: workerData } = await supabase
        .rpc('check_team_member_by_email', { check_email: user.email || '' })
      
      const worker = workerData && workerData.length > 0 ? workerData[0] : null
      
      if (worker && worker.user_id) {
        redirect('/worker')
      } else {
        redirect('/dashboard')
      }
    }
  } catch {
    // Auth/env failed on marketing domain: show landing page instead of failing
  }

  return <BrnnoV2 />
}

