import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getPages,
  subscribePageToLeadgen,
} from '@/lib/integrations/meta'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/integrations/meta/callback`
  const fail = (q: string) =>
    NextResponse.redirect(`${baseUrl}/dashboard/marketing/integrations?${q}`)

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code) {
    return fail('error=access_denied')
  }

  if (!state || !UUID_RE.test(state)) {
    return fail('error=invalid_state')
  }

  const businessId = state

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return fail('error=server_config')
  }

  try {
    const shortLived = await exchangeCodeForToken(code, redirectUri)
    const { token: longLived, expiresAt } = await getLongLivedToken(shortLived)
    const pages = await getPages(longLived)

    if (!pages.length) {
      return fail('error=no_pages')
    }

    const page = pages[0]
    await subscribePageToLeadgen(page.id, page.access_token)

    const supabase = createClient(supabaseUrl, serviceKey)
    const now = new Date().toISOString()

    const { data: existing } = await supabase
      .from('integrations')
      .select('automations')
      .eq('business_id', businessId)
      .eq('provider', 'meta')
      .maybeSingle()

    const defaultAutomations = {
      createCrmRecord: true,
      fireSmsAgent: true,
      sendWelcomeEmail: true,
      addToNurtureCampaign: false,
      nurtureCampaignId: null as string | null,
    }

    const { error: upsertErr } = await supabase.from('integrations').upsert(
      {
        business_id: businessId,
        provider: 'meta',
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        connected_at: now,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        automations: (existing?.automations as object | undefined) ?? defaultAutomations,
      },
      { onConflict: 'business_id,provider' }
    )

    if (upsertErr) {
      console.error('[meta callback] upsert:', upsertErr)
      return fail('error=save_failed')
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/marketing/integrations?connected=true`)
  } catch (e) {
    console.error('[meta callback]', e)
    return fail('error=oauth_failed')
  }
}
