import DashboardLayoutClient from './dashboard-layout-client'
import { canAccessDashboardAiAssistant } from '@/lib/actions/permissions'
import { getBusiness } from '@/lib/actions/business'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const showAIAssistant = await canAccessDashboardAiAssistant()
  const business = await getBusiness()
  const showOnboardingBanner =
    business != null && business.onboarding_completed === false

  return (
    <DashboardLayoutClient showAIAssistant={showAIAssistant} showOnboardingBanner={showOnboardingBanner}>
      {children}
    </DashboardLayoutClient>
  )
}
