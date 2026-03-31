import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unsubscribePageFromLeadgen } from '@/lib/integrations/meta'

export async function POST() {
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

    const { data: row, error: fetchErr } = await supabase
      .from('integrations')
      .select('id, page_id, page_access_token')
      .eq('business_id', business.id)
      .eq('provider', 'meta')
      .maybeSingle()

    if (fetchErr) {
      console.error('[meta disconnect] fetch:', fetchErr)
      return NextResponse.json({ error: 'Failed to load integration' }, { status: 500 })
    }

    if (!row?.page_id || !row.page_access_token) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    try {
      await unsubscribePageFromLeadgen(row.page_id, row.page_access_token)
    } catch (e) {
      console.warn('[meta disconnect] Meta unsubscribe (non-fatal):', e)
    }

    const { error: updErr } = await supabase
      .from('integrations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', row.id)

    if (updErr) {
      console.error('[meta disconnect] update:', updErr)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[meta disconnect]', e)
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
}
