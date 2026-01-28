import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { date, time, name, email, phone, businessName, notes } = body

        // Store booking in database
        const supabase = await createClient()

        const { error } = await supabase
            .from('demo_bookings')
            .insert({
                scheduled_date: date,
                scheduled_time: time,
                name,
                email,
                phone,
                business_name: businessName,
                notes,
                status: 'scheduled'
            })

        if (error) {
            console.error('Database error:', error)
            throw error
        }

        // TODO: Send confirmation email
        // TODO: Add to Google Calendar
        // TODO: Send Slack notification

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Booking error:', error)
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}
