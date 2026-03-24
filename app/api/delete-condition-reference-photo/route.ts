import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

const BUCKET = 'condition-reference-photos'

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i < 0) return null
  const rest = url.slice(i + marker.length).split('?')[0]
  try {
    return decodeURIComponent(rest)
  } catch {
    return rest
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = typeof body?.url === 'string' ? body.url.trim() : ''

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const path = storagePathFromPublicUrl(url)
    if (!path) {
      return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 })
    }

    const firstSegment = path.split('/')[0]
    if (firstSegment !== business.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])

    if (removeError) {
      console.error('Condition reference photo delete error:', removeError)
      return NextResponse.json(
        { error: `Failed to delete: ${removeError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting condition reference photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
