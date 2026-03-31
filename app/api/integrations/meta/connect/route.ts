import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isIntegrationAllowed } from '@/lib/integrations/check-plan'

export async function GET(_request: NextRequest) {
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const clientSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await clientSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const allowed = await isIntegrationAllowed(supabase, business.id)
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
    }

    const appId = process.env.META_APP_ID
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    if (!appId || !baseUrl) {
      return NextResponse.json({ error: 'Meta integration is not configured' }, { status: 500 })
    }

    const redirectUri = `${baseUrl}/api/integrations/meta/callback`
    const scope =
      'pages_manage_ads,pages_read_engagement,leads_retrieval,ads_management'
    const oauthUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(business.id)}`

    return NextResponse.redirect(oauthUrl)
  } catch (e) {
    console.error('[meta connect]', e)
    return NextResponse.json({ error: 'Failed to start Meta connection' }, { status: 500 })
  }
}
