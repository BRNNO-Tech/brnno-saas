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

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(redirectTarget)
  }

  const response = NextResponse.redirect(redirectTarget)

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

  await supabase.auth.signOut()

  return response
}
