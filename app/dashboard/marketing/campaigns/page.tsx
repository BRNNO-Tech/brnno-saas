import { redirect } from 'next/navigation'
import { canAccessMarketing } from '@/lib/actions/permissions'
import CampaignsListPageClient from './campaigns-client'

export default async function CampaignsListPage() {
  const hasMarketing = await canAccessMarketing()
  if (!hasMarketing) redirect('/dashboard/marketing/promo-codes')
  return <CampaignsListPageClient />
}
