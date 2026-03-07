import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_SIZE = 25 * 1024 * 1024 // 25MB (~8s clip)
const ALLOWED_EXTENSIONS = ['mp4', 'webm']
const ALLOWED_MIMES = ['video/mp4', 'video/webm']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Video must be under 25MB (about 8 seconds)' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use MP4 or WebM.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
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

    const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, billing_plan')
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { isAdminEmail } = await import('@/lib/permissions')
    const isPro = business.billing_plan === 'pro'
    if (!isPro && !isAdminEmail(user.email ?? null)) {
      return NextResponse.json(
        { error: 'Profile banner video is available on Pro. Upgrade to add a video banner.' },
        { status: 403 }
      )
    }

    const contentType = file.type && ALLOWED_MIMES.includes(file.type) ? file.type : 'video/mp4'
    const filePath = `${business.id}/banner-video-${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('banner-videos')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })

    if (uploadError) {
      console.error('Profile banner video upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('banner-videos')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error uploading profile banner video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
