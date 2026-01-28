import { BookingCalendar } from '@/components/booking/booking-calendar'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Book a Demo - BRNNO',
    description: 'Schedule a 30-minute demo call to see how BRNNO can transform your auto detailing business',
}

export default function BookDemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <BookingCalendar />
        </div>
    )
}
