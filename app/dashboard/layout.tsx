import DashboardLayoutClient from './dashboard-layout-client'
import { canAccessDashboardAiAssistant } from '@/lib/actions/permissions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const showAIAssistant = await canAccessDashboardAiAssistant()

  return (
    <DashboardLayoutClient showAIAssistant={showAIAssistant}>
      {children}
    </DashboardLayoutClient>
  )
}
