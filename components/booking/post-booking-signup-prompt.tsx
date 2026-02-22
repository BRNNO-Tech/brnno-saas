'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { getCustomerBookingTranslations, type CustomerBookingLang } from '@/lib/translations/customer-booking'

type Props = {
  guestEmail: string
  subdomain: string
  lang?: 'en' | 'es'
}

export function PostBookingSignupPrompt({ guestEmail, subdomain, lang = 'en' }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const t = getCustomerBookingTranslations((lang || 'en') as CustomerBookingLang)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null)
      setLoading(false)
    })
  }, [])

  if (loading || user) return null
  if (!guestEmail?.trim()) return null

  const signUpUrl = `/sign-up?email=${encodeURIComponent(guestEmail.trim())}&subdomain=${encodeURIComponent(subdomain)}`
  const dashboardUrl = `/${subdomain}/dashboard${lang === 'es' ? '?lang=es' : ''}`

  return (
    <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
        {t.trackBookingPromptTitle}
      </h3>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        {t.trackBookingPromptBody}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href={signUpUrl}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            {t.createAccount}
          </Button>
        </Link>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:border-blue-500 dark:text-blue-400"
          onClick={() => router.push(dashboardUrl)}
        >
          {t.maybeLater}
        </Button>
      </div>
    </div>
  )
}
