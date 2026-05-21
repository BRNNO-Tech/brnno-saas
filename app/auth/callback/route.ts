import { PASSWORD_UPDATE_PATH } from '@/lib/auth-redirects'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Handles the redirect from Supabase after email confirmation (or OAuth).
 * Exchanges the auth code for a session and redirects to the app.
 * Use this URL as emailRedirectTo when calling signUp() or auth.resend() so
 * confirmation links point to your actual site (e.g. app.brnno.io), not localhost.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const isRecovery = requestUrl.searchParams.get('type') === 'recovery'
  const next =
    requestUrl.searchParams.get('next') ??
    (isRecovery ? PASSWORD_UPDATE_PATH : '/')

  const redirectUrl = new URL(next, requestUrl.origin)

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  // Session cookies must be written onto the redirect response (not only cookieStore)
  const response = NextResponse.redirect(redirectUrl)
  const sessionCookies: Array<{ name: string; value: string }> = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth/callback] Missing Supabase environment variables')
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'Server configuration error')
    return NextResponse.redirect(errorUrl)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          sessionCookies.push({ name, value })
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errorUrl)
  }

  if (next.includes('/dashboard')) {
    const cookies = new Map(
      request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
    )
    sessionCookies.forEach((cookie) => cookies.set(cookie.name, cookie.value))

    try {
      const res = await fetch(new URL('/api/link-guest-bookings', requestUrl.origin), {
        method: 'POST',
        headers: {
          cookie: Array.from(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; '),
        },
      })

      if (!res.ok) {
        console.warn('[auth/callback] Link guest bookings failed:', res.status)
      }
    } catch (linkError) {
      console.warn('[auth/callback] Link guest bookings failed:', linkError)
    }
  }

  return response
}
