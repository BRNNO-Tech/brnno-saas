import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDemoBookingNotifications } from '@/lib/email'

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

        void sendDemoBookingNotifications({
            name,
            email,
            phone: phone ?? null,
            businessName: businessName ?? null,
            notes: notes ?? null,
            scheduledDateIso: date,
            scheduledTimeLabel: time,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Booking error:', error)
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}
