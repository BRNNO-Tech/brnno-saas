import { canAccessMarketing } from '@/lib/actions/permissions'
import MarketingTabs from '@/components/marketing/marketing-tabs'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const hasMarketing = await canAccessMarketing()

  return (
    <div className="w-full min-h-0">
      <MarketingTabs hasMarketing={hasMarketing} />
      {children}
    </div>
  )
}
