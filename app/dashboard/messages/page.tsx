import { canAccessMessaging } from '@/lib/actions/permissions'
import { getConversations } from '@/lib/actions/messages'
import UpgradePrompt from '@/components/upgrade-prompt'
import { MessagesInbox } from './messages-inbox'

export const revalidate = 60

export default async function MessagesPage() {
  const canView = await canAccessMessaging()
  if (!canView) return <UpgradePrompt feature="Two-way messaging" requiredTier="pro" />

  const initialConversations = await getConversations()

  return (
    <div className="p-6 dashboard-theme">
      <div className="mb-6">
        <h1 className="font-dash-condensed text-3xl font-bold text-[var(--dash-text)]">
          Messages
        </h1>
        <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
          Two-way SMS with customers
        </p>
      </div>
      <MessagesInbox initialConversations={initialConversations} />
    </div>
  )
}
