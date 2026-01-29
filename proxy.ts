import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
    const host = request.headers.get('host') || ''

    // If user is on app.brnno.io, rewrite root to /login
    if (host === 'app.brnno.io' || host.startsWith('app.brnno.io:')) {
        const url = request.nextUrl.clone()

        // If they hit the root, send them to login
        if (url.pathname === '/') {
            url.pathname = '/login'
            return NextResponse.rewrite(url)
        }
    }

    // Continue with Supabase session management
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - api/ (API routes)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}