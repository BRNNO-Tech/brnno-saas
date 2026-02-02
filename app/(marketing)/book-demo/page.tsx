import { BookingCalendar } from '@/components/booking/booking-calendar'
import { getTranslations, type Language } from '@/lib/translations/booking'
import type { Metadata } from 'next'

type Props = { searchParams: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    let params: { lang?: string } = {}
    try {
        params = await searchParams
    } catch {
        // ignore
    }
    const lang = (params?.lang || 'en') as Language
    const t = getTranslations(lang)
    return {
        title: t.pageTitle,
        description: t.pageDescription,
    }
}

export default async function BookDemoPage({ searchParams }: Props) {
    let params: { lang?: string } = {}
    try {
        params = await searchParams
    } catch {
        // ignore
    }
    const lang = (params?.lang || 'en') as Language

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <BookingCalendar lang={lang} />
        </div>
    )
}
