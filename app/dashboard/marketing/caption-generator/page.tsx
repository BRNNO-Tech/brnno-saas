import { redirect } from 'next/navigation'
import { canAccessMarketing } from '@/lib/actions/permissions'
import CaptionGeneratorPageClient from './caption-generator-client'

export default async function CaptionGeneratorPage() {
  const hasMarketing = await canAccessMarketing()
  if (!hasMarketing) redirect('/dashboard/marketing/promo-codes')
  return <CaptionGeneratorPageClient />
}
