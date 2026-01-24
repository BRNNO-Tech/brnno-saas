import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const businessId = searchParams.get('businessId')

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
        }

        // Verify business belongs to user
        const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('owner_id', user.id)
            .single()

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 })
        }

        // Get priority blocks
        const { data: blocks, error } = await supabase
            .from('priority_time_blocks')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return NextResponse.json({ blocks: blocks || [] })
    } catch (error) {
        console.error('Error fetching priority blocks:', error)
        return NextResponse.json(
            { error: 'Failed to fetch priority blocks' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            businessId,
            name,
            days,
            start_time,
            end_time,
            priority_for,
            fallback_hours,
            enabled,
        } = body

        if (!businessId || !name || !days || !start_time || !end_time || !priority_for) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify business belongs to user
        const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('owner_id', user.id)
            .single()

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 })
        }

        // Create priority block
        const { data: block, error } = await supabase
            .from('priority_time_blocks')
            .insert({
                business_id: businessId,
                name,
                days,
                start_time,
                end_time,
                priority_for,
                fallback_hours: fallback_hours ?? 24,
                enabled: enabled !== undefined ? enabled : true,
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ block })
    } catch (error) {
        console.error('Error creating priority block:', error)
        return NextResponse.json(
            { error: 'Failed to create priority block' },
            { status: 500 }
        )
    }
}
