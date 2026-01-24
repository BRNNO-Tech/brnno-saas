'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    // Still redirect even if there's an error
  }

  // Check if we're on app.brnno.io domain
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
    // Redirect to app.brnno.io/login
    redirect('https://app.brnno.io/login')
  }
  
  // Otherwise redirect to relative login
  redirect('/login')
}
