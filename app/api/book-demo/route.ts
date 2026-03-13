import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            message: rawMessage,
            date,
            time,
            phone,
            businessName,
            notes,
        } = body

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // Support simple { name, email, message } or calendar form { date, time, name, email, phone, businessName, notes }
        let message: string | null = rawMessage != null ? String(rawMessage).trim() || null : null
        if (!message && (date || time || phone || businessName || notes)) {
            const parts: string[] = []
            if (date) parts.push(`Date: ${date}`)
            if (time) parts.push(`Time: ${time}`)
            if (phone) parts.push(`Phone: ${phone}`)
            if (businessName) parts.push(`Business: ${businessName}`)
            if (notes) parts.push(`Notes: ${notes}`)
            message = parts.length ? parts.join(' · ') : null
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('demo_bookings')
            .insert({
                name: String(name).trim(),
                email: String(email).trim(),
                message,
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
