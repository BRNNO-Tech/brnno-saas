import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Check if we're on app.brnno.io domain
  const host = request.headers.get('host') || ''
  
  if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
    // Redirect to app.brnno.io/login
    return NextResponse.redirect(new URL('https://app.brnno.io/login'))
  }
  
  // Otherwise use the configured site URL or default
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}

