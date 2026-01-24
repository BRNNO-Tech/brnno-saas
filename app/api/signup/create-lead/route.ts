import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Check if lead already exists (not converted)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('signup_leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw checkError
    }

    if (existing) {
      return NextResponse.json({ leadId: existing.id })
    }

    // Create new lead
    const { data: lead, error } = await supabaseAdmin
      .from('signup_leads')
      .insert({
        email: email.toLowerCase().trim(),
        current_step: 1,
        step_1_completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Create signup lead error:', error)
      throw error
    }

    return NextResponse.json({ leadId: lead.id })
  } catch (error: any) {
    console.error('Create signup lead error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create lead',
        details: error 
      },
      { status: 500 }
    )
  }
}

