import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logo_url, accent_color, sender_name, default_tone, booking_banner_url } = body

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

    // Update brand settings
    const brandData: any = {}
    if (logo_url !== undefined) brandData.logo_url = logo_url
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
