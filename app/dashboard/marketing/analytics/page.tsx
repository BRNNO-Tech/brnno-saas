import { redirect } from 'next/navigation'
import { canAccessMarketing } from '@/lib/actions/permissions'
import MarketingAnalyticsPageClient from './analytics-client'

export default async function MarketingAnalyticsPage() {
  const hasMarketing = await canAccessMarketing()
  if (!hasMarketing) redirect('/dashboard/marketing/promo-codes')
  return <MarketingAnalyticsPageClient />
}

