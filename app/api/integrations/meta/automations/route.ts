import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { IntegrationAutomations } from '@/types/marketing'
import { moduleApiGateResponse } from '@/lib/subscription/module-api-gate'

function parseAutomations(body: unknown): IntegrationAutomations | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if (
    typeof o.createCrmRecord !== 'boolean' ||
    typeof o.fireSmsAgent !== 'boolean' ||
    typeof o.sendWelcomeEmail !== 'boolean' ||
    typeof o.addToNurtureCampaign !== 'boolean'
  ) {
    return null
  }
  const nid = o.nurtureCampaignId
  if (nid != null && typeof nid !== 'string') return null
  return {
    createCrmRecord: o.createCrmRecord,
    fireSmsAgent: o.fireSmsAgent,
    sendWelcomeEmail: o.sendWelcomeEmail,
    addToNurtureCampaign: o.addToNurtureCampaign,
    nurtureCampaignId: typeof nid === 'string' ? nid : null,
  }
}

export async function PATCH(request: NextRequest) {
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

    const gate = await moduleApiGateResponse(user, 'marketing')
    if (gate) return gate

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const automations = parseAutomations(raw)
    if (!automations) {
      return NextResponse.json({ error: 'Invalid automations body' }, { status: 400 })
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

    const { data: updated, error: updErr } = await supabase
      .from('integrations')
      .update({
        automations,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', business.id)
      .eq('provider', 'meta')
      .select('id')
      .maybeSingle()

    if (updErr) {
      console.error('[meta automations]', updErr)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[meta automations]', e)
    return NextResponse.json({ error: 'Failed to update automations' }, { status: 500 })
  }
}
