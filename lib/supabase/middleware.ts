import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper function to get the appropriate login URL based on domain
function getLoginUrl(request: NextRequest): URL {
  const host = request.headers.get('host') || ''

  // If on app.brnno.io, redirect to app.brnno.io/login
  if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
    const protocol = request.nextUrl.protocol
    const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
    return new URL(`${protocol}//app.brnno.io${port}/login`)
  }

  // Otherwise, use relative redirect
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return url
}

// Public booking API routes — no session required (booking flow is anonymous)
const PUBLIC_API_ROUTES = [
  '/api/booking/create-lead',
  '/api/booking/update-lead',
  '/api/booking/analyze-photos',
  '/api/create-booking',
  '/api/validate-discount-code',
  '/api/invoice',
  '/api/webhooks',
  '/api/ai-widget',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Allow public booking APIs through without running auth/session logic
  if (PUBLIC_API_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return supabaseResponse
  }

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    // Allow request to proceed if env vars are missing (for development)
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error('Error getting user:', error)
    // If there's an error, allow the request to proceed
    return supabaseResponse
  }

  // Get host for domain-aware routing
  const host = request.headers.get('host') || ''
  const isAppDomain = host === 'app.brnno.io' || host.startsWith('app.brnno.io:')

  // Allow access to auth routes without authentication
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/sign-up') ||
    request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/worker-signup') ||
    request.nextUrl.pathname.startsWith('/auth')

  // Allow access to booking routes without authentication
  // Booking routes are at /[subdomain] or /[subdomain]/book
  // Check if path doesn't start with known protected routes and could be a subdomain
  const pathname = request.nextUrl.pathname
  const isBookingRoute =
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/sign-up') &&
    !pathname.startsWith('/sign-in') &&
    !pathname.startsWith('/reset-password') &&
    !pathname.startsWith('/worker-signup') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/worker') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    pathname !== '/' &&
    !pathname.includes('.')

  // Allow public booking API routes (lead capture, booking flow)
  const isBookingApiRoute = pathname.startsWith('/api/booking')

  // Allow public booking-related APIs that live outside /api/booking
  const isPublicApiRoute =
    pathname === '/api/validate-discount-code' ||
    pathname === '/api/create-booking' ||
    pathname.startsWith('/api/ai-widget')

  // Allow demo mode route
  const isDemoRoute = pathname.startsWith('/demo')

  // Check if demo mode cookie exists
  const demoModeCookie = request.cookies.get('demo-mode')
  const isDemoMode = demoModeCookie?.value === 'true'

  // Allow public quote viewing route
  const isQuoteRoute = pathname.startsWith('/q/')

  // Public shared invoice (tokenized link, no auth)
  const isPublicInvoiceShareRoute = pathname.startsWith('/invoice/')

  // Allow public demo booking route
  const isBookDemoRoute = pathname.startsWith('/book-demo')

  // Public routes that don't require authentication
  // On app.brnno.io, root is treated as login (handled in main middleware)
  const isPublicRoute =
    isAuthRoute ||
    isBookingRoute ||
    isBookingApiRoute ||
    isPublicApiRoute ||
    isDemoRoute ||
    isQuoteRoute ||
    isPublicInvoiceShareRoute ||
    isBookDemoRoute ||
    (!isAppDomain && pathname === '/') || // Only allow root on marketing domain
    pathname === '/landing' ||
    pathname === '/contact' ||
    pathname === '/add-ons' ||
    pathname === '/ai-add-ons'

  // If no user and trying to access protected route, check for demo mode first
  if (!user && !isPublicRoute) {
    // Allow access if demo mode is active
    if (isDemoMode) {
      // Continue with demo mode
    } else {
      // Redirect to login - use domain-aware redirect
      return NextResponse.redirect(getLoginUrl(request))
    }
  }

  // Set demo mode cookie if accessing demo route
  if (isDemoRoute) {
    supabaseResponse.cookies.set('demo-mode', 'true', {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })
  }

  // Clear demo mode cookie if user is authenticated (real account takes precedence)
  if (user && isDemoMode) {
    supabaseResponse.cookies.delete('demo-mode')
  }

  // Redirect authenticated users away from business auth pages only (not customer auth)
  // Customer auth (/sign-in, /sign-up, /reset-password) is for booking customers; let them through
  // so they can be redirected by the page to subdomain dashboard when subdomain is present
  const isBusinessAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/worker-signup')
  if (user && isBusinessAuthRoute) {
    const url = request.nextUrl.clone()
    const { data: workerData } = await supabase
      .rpc('check_team_member_by_email', { check_email: user.email || '' })
    const worker = workerData && workerData.length > 0 ? workerData[0] : null
    url.pathname = worker ? '/worker' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect workers away from business dashboard
  if (user && pathname.startsWith('/dashboard')) {
    // Check if user is a worker
    const { data: workerData } = await supabase
      .rpc('check_team_member_by_email', { check_email: user.email || '' })

    const worker = workerData && workerData.length > 0 ? workerData[0] : null

    if (worker && worker.user_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/worker'
      return NextResponse.redirect(url)
    }
  }

  // Redirect business owners away from worker dashboard
  if (user && pathname.startsWith('/worker')) {
    // Check if user is a worker
    const { data: workerData } = await supabase
      .rpc('check_team_member_by_email', { check_email: user.email || '' })

    const worker = workerData && workerData.length > 0 ? workerData[0] : null

    if (!worker || !worker.user_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Feature gating: Protect team management route (module-based)
  if (user && pathname.startsWith('/dashboard/team')) {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('modules, billing_plan, subscription_status, subscription_ends_at')
        .eq('owner_id', user.id)
        .single()

      if (!business) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/settings'
        url.searchParams.set('upgrade', 'team')
        return NextResponse.redirect(url)
      }

      // Admin emails always have access
      const { isAdminEmail } = await import('@/lib/permissions')
      if (user.email && isAdminEmail(user.email)) {
        // allow — fall through
      } else {
        const hasTeamModule = business.modules?.teamManagement === true
        const isProPlan = business.billing_plan === 'pro'

        // Team management requires teamManagement module (Pro plan grants it via subscription)
        if (!hasTeamModule) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/settings/subscription'
          url.searchParams.set('upgrade', 'teamManagement')
          return NextResponse.redirect(url)
        }
      }
    } catch (error) {
      console.error('Error checking team access in middleware:', error)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

