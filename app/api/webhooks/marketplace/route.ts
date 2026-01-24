import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

const WEBHOOK_SECRET = process.env.MARKETPLACE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!supabase) {
    console.error('[Marketplace Webhook] Supabase not configured')
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    // Verify webhook secret
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-marketplace-signature')
      if (signature !== WEBHOOK_SECRET) {
        console.error('[Marketplace Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { event, data } = body

    console.log('[Marketplace Webhook] Received event:', event)

    switch (event) {
      case 'user.created':
        return await handleUserCreated(data)
      case 'user.updated':
        return await handleUserUpdated(data)
      case 'business.created':
        return await handleBusinessCreated(data)
      case 'business.updated':
        return await handleBusinessUpdated(data)
      default:
        console.log('[Marketplace Webhook] Unhandled event type:', event)
        return NextResponse.json({ 
          success: true, 
          message: 'Event not handled',
          event 
        })
    }
  } catch (error: any) {
    console.error('[Marketplace Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: any) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { id, email, name, phone, user_type = 'customer' } = data

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  console.log('[Marketplace Webhook] Creating user:', { email, name, user_type })

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: name || email,
      marketplace_user_id: id,
      user_type: user_type, // 'customer' from Firebase marketplace
      firebase_user_id: id
    },
    phone: phone || undefined
  })

  if (authError) {
    console.error('[Marketplace Webhook] Error creating user:', authError)
    return NextResponse.json(
      { error: authError.message },
      { status: 500 }
    )
  }

  console.log('[Marketplace Webhook] User created successfully:', authData.user.id)
  return NextResponse.json({ 
    success: true, 
    userId: authData.user.id,
    email: authData.user.email
  })
}

async function handleUserUpdated(data: any) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { id: firebaseUserId, email, name, phone } = data

  if (!firebaseUserId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  console.log('[Marketplace Webhook] Updating user:', firebaseUserId)

  // Find user by firebase_user_id in metadata
  const { data: { users }, error: findError } = await supabase.auth.admin.listUsers()
  
  if (findError) {
    console.error('[Marketplace Webhook] Error finding users:', findError)
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  const user = users.find(u => 
    u.user_metadata?.firebase_user_id === firebaseUserId ||
    u.user_metadata?.marketplace_user_id === firebaseUserId
  )

  if (!user) {
    console.log('[Marketplace Webhook] User not found:', firebaseUserId)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Update user
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      email: email || user.email,
      user_metadata: {
        ...user.user_metadata,
        full_name: name || user.user_metadata?.full_name
      },
      phone: phone || user.phone || undefined
    }
  )

  if (updateError) {
    console.error('[Marketplace Webhook] Error updating user:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log('[Marketplace Webhook] User updated successfully:', user.id)
  return NextResponse.json({ success: true, userId: user.id })
}

async function handleBusinessCreated(data: any) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { owner_email, id: marketplace_business_id, ...businessData } = data

  if (!owner_email) {
    return NextResponse.json({ error: 'Owner email is required' }, { status: 400 })
  }

  console.log('[Marketplace Webhook] Creating business for owner:', owner_email)

  // Find owner by email
  const { data: { users }, error: findError } = await supabase.auth.admin.listUsers()
  
  if (findError) {
    console.error('[Marketplace Webhook] Error finding owner:', findError)
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  const owner = users.find(u => u.email === owner_email)

  if (!owner) {
    console.log('[Marketplace Webhook] Owner not found:', owner_email)
    return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  }

  // Create business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      owner_id: owner.id,
      marketplace_business_id: marketplace_business_id,
      firebase_user_id: owner.user_metadata?.firebase_user_id || null,
      ...businessData
    })
    .select()
    .single()

  if (businessError) {
    console.error('[Marketplace Webhook] Error creating business:', businessError)
    return NextResponse.json({ error: businessError.message }, { status: 500 })
  }

  console.log('[Marketplace Webhook] Business created successfully:', business.id)
  return NextResponse.json({ success: true, businessId: business.id })
}

async function handleBusinessUpdated(data: any) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { id: marketplace_business_id, ...updateData } = data

  if (!marketplace_business_id) {
    return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
  }

  console.log('[Marketplace Webhook] Updating business:', marketplace_business_id)

  // Update business by marketplace_business_id
  const { data: business, error: updateError } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('marketplace_business_id', marketplace_business_id)
    .select()
    .single()

  if (updateError) {
    console.error('[Marketplace Webhook] Error updating business:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  console.log('[Marketplace Webhook] Business updated successfully:', business.id)
  return NextResponse.json({ success: true, businessId: business.id })
}
