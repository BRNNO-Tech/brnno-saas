import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/integrations/meta'
import { isIntegrationAllowed } from '@/lib/integrations/check-plan'
import { processLead } from '@/lib/integrations/lead-processor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  const verify = process.env.META_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verify && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

type LeadgenChangeValue = {
  leadgen_id?: string
  ad_id?: string
  form_id?: string
  page_id?: string
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('X-Hub-Signature-256')

  if (!verifyWebhookSignature(rawBody, sig)) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: {
    object?: string
    entry?: Array<{
      id: string
      changes?: Array<{ field: string; value: LeadgenChangeValue }>
    }>
  }

  try {
    body = JSON.parse(rawBody) as typeof body
  } catch {
    return new Response('OK', { status: 200 })
  }

  if (body.object !== 'page') {
    return new Response('OK', { status: 200 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return new Response('OK', { status: 200 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  for (const entry of body.entry ?? []) {
    const pageId = entry.id
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue
      const v = change.value
      const metaLeadId = v.leadgen_id
      if (!metaLeadId) continue

      const { data: integration } = await supabase
        .from('integrations')
        .select('id, business_id, is_active')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .maybeSingle()

      if (!integration) continue

      const allowed = await isIntegrationAllowed(supabase, integration.business_id)
      if (!allowed) continue

      const { error: insErr } = await supabase.from('integration_leads').insert({
        business_id: integration.business_id,
        integration_id: integration.id,
        meta_lead_id: metaLeadId,
        ad_id: v.ad_id ?? null,
        form_id: v.form_id ?? null,
        raw_data: v as unknown as Record<string, unknown>,
        status: 'pending',
      })

      if (insErr) {
        if (insErr.code === '23505') {
          continue
        }
        console.error('[meta webhook] insert lead:', insErr)
        continue
      }

      void processLead(metaLeadId, integration.id).catch((err) => {
        console.error('[meta webhook] processLead:', err)
      })
    }
  }

  return new Response('OK', { status: 200 })
}
