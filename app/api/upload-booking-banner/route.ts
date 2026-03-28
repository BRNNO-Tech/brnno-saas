import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  contentTypeForImageStorageUpload,
  HEIC_HEIF_ERROR_MESSAGE,
} from '@/lib/storage/image-upload-content-type'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (20MB limit for banners)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      )
    }

    // Validate file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt && ['heic', 'heif'].includes(fileExt)) {
      return NextResponse.json({ error: HEIC_HEIF_ERROR_MESSAGE }, { status: 400 })
    }
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed formats: ${allowedExtensions.join(', ').toUpperCase()}` },
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

    // Create a client-side Supabase client to verify the user
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Use service role client for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get business (need billing_plan for Pro gating)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, billing_plan')
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const { isAdminEmail } = await import('@/lib/permissions')
    const isPro = business.billing_plan === 'pro'
    if (!isPro && !isAdminEmail(user.email ?? null)) {
      return NextResponse.json(
        { error: 'Booking page banner is available on Pro. Upgrade to add a custom banner.' },
        { status: 403 }
      )
    }

    // Path inside the bucket (no bucket name in path)
    const filePath = `${business.id}/banner-${Date.now()}.${fileExt}`
    const contentType = contentTypeForImageStorageUpload(file.type, fileExt)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('booking-banners')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })

    if (uploadError) {
      console.error('Banner upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload banner: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL (same path as upload)
    const { data: { publicUrl } } = supabase.storage
      .from('booking-banners')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error uploading booking banner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
