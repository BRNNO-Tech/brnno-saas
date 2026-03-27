import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function loginRedirectUrl(request: NextRequest): URL {
  const host = request.headers.get('host') || ''
  if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
    return new URL('https://app.brnno.io/login')
  }
  return new URL('/login', request.url)
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const redirectTarget = loginRedirectUrl(request)

  // 303 so the browser follows with GET to /login (default 307 repeats POST and breaks login page)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(redirectTarget, 303)
  }

  const response = NextResponse.redirect(redirectTarget, 303)

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) {
    console.error('[signout] supabase.auth.signOut:', error.message)
  }

  // Ensure chunked / residual cookies are cleared (middleware + signOut race)
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith('sb-') || c.name.includes('supabase')) {
      response.cookies.set(c.name, '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
  }

  return response
}
