import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getInitialConditionConfig } from '@/lib/utils/default-settings'

// Trial period in days
const TRIAL_PERIOD_DAYS = 14

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, billingPeriod, email, businessName, userId, signupData, teamSize, signupLeadId } = body

    if (!planId || !billingPeriod || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    // Use service role client for all operations during signup (bypasses RLS and auth checks)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify user exists using admin client
    const { data: adminUser, error: adminError } = await adminClient.auth.admin.getUserById(userId)

    if (adminError || !adminUser || adminUser.user.id !== userId) {
      return NextResponse.json(
        { error: 'User not found. Please ensure your account was created successfully.' },
        { status: 401 }
      )
    }

    // Use admin client for all database operations (bypasses RLS)
    const dbClient = adminClient

    // Check if business already exists
    const { data: existingBusiness } = await dbClient
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'Business already exists for this user' },
        { status: 400 }
      )
    }

    // Calculate trial end date
    const trialStartDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS)

    // Get smart condition config based on business location (state)
    const conditionConfig = getInitialConditionConfig(signupData?.state || null)

    // Create business with trial status
    const { data: business, error: businessError } = await dbClient
      .from('businesses')
      .insert({
        owner_id: userId,
        name: signupData?.businessName || businessName,
        email: signupData?.email || email,
        phone: signupData?.phone || null,
        address: signupData?.address || null,
        city: signupData?.city || null,
        state: signupData?.state || null,
        zip: signupData?.zip || null,
        subdomain: signupData?.subdomain || null,
        description: signupData?.description || null,
        subscription_plan: planId,
        subscription_status: 'trialing',
        subscription_billing_period: billingPeriod,
        subscription_started_at: trialStartDate.toISOString(),
        subscription_ends_at: trialEndDate.toISOString(),
        team_size: teamSize || (planId === 'starter' ? 1 : (planId === 'pro' ? 2 : 3)),
        condition_config: conditionConfig, // Smart onboarding: region-specific defaults
      })
      .select()
      .single()

    if (businessError) {
      console.error('Error creating business with trial:', businessError)
      return NextResponse.json(
        { error: `Failed to create business: ${businessError.message}` },
        { status: 500 }
      )
    }

    // Mark signup lead as converted if we have a lead ID
    if (signupLeadId) {
      const { error: leadUpdateError } = await dbClient
        .from('signup_leads')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
        })
        .eq('id', signupLeadId)

      if (leadUpdateError) {
        console.error('Error updating signup lead:', leadUpdateError)
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({
      success: true,
      businessId: business.id,
      trialEndDate: trialEndDate.toISOString(),
      message: `Free trial started! Your trial expires on ${trialEndDate.toLocaleDateString()}`,
    })
  } catch (error: any) {
    console.error('Error starting free trial:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start free trial' },
      { status: 500 }
    )
  }
}
