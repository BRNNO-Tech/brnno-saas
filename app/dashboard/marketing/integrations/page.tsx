import { redirect } from 'next/navigation'
import { canAccessMarketing } from '@/lib/actions/permissions'
import MarketingIntegrationsPageClient from './integrations-client'

export default async function MarketingIntegrationsPage() {
  const hasMarketing = await canAccessMarketing()
  if (!hasMarketing) redirect('/dashboard/marketing/promo-codes')
  return <MarketingIntegrationsPageClient />
}
