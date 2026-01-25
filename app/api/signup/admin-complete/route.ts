import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            userId,
            email,
            businessName,
            planId,
            billingPeriod,
            teamSize,
            signupLeadId,
            signupData,
        } = body || {}

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminListRaw = process.env.ADMIN_SIGNUP_EMAILS || process.env.ADMIN_EMAILS || ''
        const adminEmails = adminListRaw
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)

        if (!adminEmails.includes(String(email).toLowerCase())) {
            return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { autoRefreshToken: false, persistSession: false },
            }
        )

        if (signupLeadId) {
            await supabase
                .from('signup_leads')
                .update({
                    converted: true,
                    converted_at: new Date().toISOString(),
                })
                .eq('id', signupLeadId)
        }

        const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', userId)
            .single()

        const normalizedPlan = planId || 'starter'
        const normalizedPeriod = billingPeriod === 'yearly' ? 'yearly' : 'monthly'
        const normalizedTeamSize = teamSize || (normalizedPlan === 'starter' ? 1 : normalizedPlan === 'pro' ? 2 : 3)

        if (!existingBusiness) {
            const { error: businessError } = await supabase
                .from('businesses')
                .insert({
                    owner_id: userId,
                    name: signupData?.businessName || businessName || 'My Business',
                    email: signupData?.email || email || null,
                    phone: signupData?.phone || null,
                    address: signupData?.address || null,
                    city: signupData?.city || null,
                    state: signupData?.state || null,
                    zip: signupData?.zip || null,
                    subdomain: signupData?.subdomain || null,
                    description: signupData?.description || null,
                    subscription_plan: normalizedPlan,
                    subscription_status: 'active',
                    subscription_billing_period: normalizedPeriod,
                    subscription_started_at: new Date().toISOString(),
                    team_size: normalizedTeamSize,
                })

            if (businessError) {
                return NextResponse.json(
                    { error: businessError.message || 'Failed to create business' },
                    { status: 500 }
                )
            }
        } else {
            await supabase
                .from('businesses')
                .update({
                    subscription_plan: normalizedPlan,
                    subscription_status: 'active',
                    subscription_billing_period: normalizedPeriod,
                    subscription_started_at: new Date().toISOString(),
                    team_size: normalizedTeamSize,
                })
                .eq('owner_id', userId)
        }

        return NextResponse.json({ success: true, redirect: '/dashboard' })
    } catch (error: any) {
        console.error('Admin signup error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to complete admin signup' },
            { status: 500 }
        )
    }
}
