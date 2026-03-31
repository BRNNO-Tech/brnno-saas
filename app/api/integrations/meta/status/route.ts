import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isIntegrationAllowed } from '@/lib/integrations/check-plan'
import type { IntegrationAutomations, MetaIntegration } from '@/types/marketing'

export async function GET() {
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

    const planOk = await isIntegrationAllowed(supabase, business.id)

    const { data: row } = await supabase
      .from('integrations')
      .select('*')
      .eq('business_id', business.id)
      .eq('provider', 'meta')
      .maybeSingle()

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { count } = await supabase
      .from('integration_leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', weekAgo)

    if (!row) {
      return NextResponse.json({
        integration: null,
        leadsLast7Days: count ?? 0,
        integrationAllowed: planOk,
      })
    }

    const r = row as Record<string, unknown>
    const integration: Omit<MetaIntegration, 'page_access_token'> & {
      page_access_token?: undefined
    } = {
      id: r.id as string,
      business_id: r.business_id as string,
      provider: 'meta',
      page_id: (r.page_id as string) || '',
      page_name: (r.page_name as string) || '',
      ad_account_id: r.ad_account_id as string | undefined,
      connected_at: r.connected_at as string,
      token_expires_at: r.token_expires_at as string | undefined,
      is_active: r.is_active as boolean,
      automations: r.automations as IntegrationAutomations,
    }

    return NextResponse.json({
      integration,
      leadsLast7Days: count ?? 0,
      integrationAllowed: planOk,
    })
  } catch (e) {
    console.error('[meta status]', e)
    return NextResponse.json({ error: 'Failed to load status' }, { status: 500 })
  }
}
