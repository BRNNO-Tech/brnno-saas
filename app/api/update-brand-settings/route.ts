import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accent_color, sender_name, default_tone, booking_banner_url } = body

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

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const wantsBrandChanges =
      accent_color !== undefined ||
      sender_name !== undefined ||
      default_tone !== undefined ||
      (booking_banner_url !== undefined && booking_banner_url != null && booking_banner_url !== '')

    if (wantsBrandChanges) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('billing_plan')
        .eq('owner_id', user.id)
        .single()
      const { isAdminEmail } = await import('@/lib/permissions')
      const isPro = biz?.billing_plan === 'pro'
      if (!isPro && !isAdminEmail(user.email ?? null)) {
        return NextResponse.json(
          { error: 'Color theme and branding are available on Pro. Upgrade to customize.' },
          { status: 403 }
        )
      }
    }

    // Update brand settings (clearing booking_banner_url is allowed for everyone)
    const brandData: any = {}
    if (accent_color !== undefined) brandData.accent_color = accent_color
    if (sender_name !== undefined) brandData.sender_name = sender_name
    if (default_tone !== undefined) brandData.default_tone = default_tone
    if (booking_banner_url !== undefined) brandData.booking_banner_url = booking_banner_url

    const { error: updateError } = await supabase
      .from('businesses')
      .update(brandData)
      .eq('owner_id', user.id)

    if (updateError) {
      console.error('Error updating brand settings:', updateError)
      return NextResponse.json(
        { error: `Failed to update brand settings: ${updateError.message}` },
        { status: 500 }
      )
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating brand settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
