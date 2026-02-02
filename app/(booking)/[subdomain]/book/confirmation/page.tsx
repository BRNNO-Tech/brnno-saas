import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookingLanguageSwitcher } from '@/components/booking/booking-language-switcher'
import { getCustomerBookingTranslations, type CustomerBookingLang } from '@/lib/translations/customer-booking'

export const dynamic = 'force-dynamic'

async function getBusiness(subdomain: string) {
  // Use service role client to bypass RLS for public booking access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration for public booking access')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

export default async function ConfirmationPage({
  params,
  searchParams
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ success?: string; lang?: string }>
}) {
  const { subdomain } = await params
  const resolved = await searchParams
  const { success, lang: langParam } = resolved
  const lang = langParam === 'es' ? 'es' : 'en'
  const t = getCustomerBookingTranslations(lang as CustomerBookingLang)
  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  if (success !== 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t.bookingNotCompleted}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {t.bookingNotCompletedMessage}
          </p>
          <Link href={`/${subdomain}`}>
            <Button>{t.returnToServices}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-6 relative">
      <div className="fixed top-4 right-4 z-50">
        <BookingLanguageSwitcher subdomain={subdomain} path="/book/confirmation" query={{ success: 'true' }} lang={lang} />
      </div>
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">{t.bookingConfirmed}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
            {t.yourAppointmentConfirmed} {business.name} {t.hasBeenConfirmed}
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold mb-4">{t.whatsNext}</h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• {t.confirmationEmailShortly}</li>
              <li>• {business.name} {t.businessWillContact}</li>
              <li>• {t.viewDetailsInEmail}</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href={`/${subdomain}${lang === 'es' ? '?lang=es' : ''}`}>
              <Button variant="outline">{t.bookAnotherService}</Button>
            </Link>
            {business.email && (
              <a href={`mailto:${business.email}`}>
                <Button>{t.contact} {business.name}</Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
