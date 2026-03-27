'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signOut() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Sign out: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    redirect('/login')
  }

  // Do not use lib/supabase/server here: its setAll() swallows cookie errors, so sessions
  // never clear when signOut runs from a Server Action.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) {
    console.error('Sign out error:', error)
  }

  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith('sb-') || c.name.includes('supabase')) {
      try {
        cookieStore.set(c.name, '', {
          path: '/',
          maxAge: 0,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      } catch {
        /* read-only cookie scope in some contexts */
      }
    }
  }

  const headersList = await headers()
  const host = headersList.get('host') || ''

  if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
    redirect('https://app.brnno.io/login')
  }

  redirect('/login')
}
