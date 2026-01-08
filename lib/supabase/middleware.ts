import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Allow access to auth routes without authentication
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
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
    !pathname.startsWith('/worker-signup') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/worker') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    pathname !== '/' &&
    !pathname.includes('.')

  // Public routes that don't require authentication
  const isPublicRoute =
    isAuthRoute ||
    isBookingRoute ||
    pathname === '/' ||
    pathname === '/landing' ||
    pathname === '/contact' ||
    pathname === '/add-ons' ||
    pathname === '/ai-add-ons'

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    // Check if user is a worker before redirecting
    // Use RPC function to bypass RLS
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

  // Feature gating: Protect team management route
  if (user && pathname.startsWith('/dashboard/team')) {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('subscription_plan, subscription_status')
        .eq('owner_id', user.id)
        .single()
      
      const tier = business?.subscription_plan?.toLowerCase()
      const isActive = business?.subscription_status === 'active'
      
      // Only Pro and Fleet plans can access team management
      if (!isActive || (tier !== 'pro' && tier !== 'fleet')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/settings'
        url.searchParams.set('upgrade', 'team')
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If there's an error checking subscription, allow access
      // The page component will handle showing the upgrade prompt
      console.error('Error checking subscription in middleware:', error)
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

