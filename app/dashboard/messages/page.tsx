import { canAccessMessaging } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'
import { MessagesInbox } from './messages-inbox'

export const revalidate = 60

export default async function MessagesPage() {
  const canView = await canAccessMessaging()
  if (!canView) return <UpgradePrompt feature="Two-way messaging" requiredTier="pro" />
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Messages</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Two-way SMS messaging with customers
        </p>
      </div>

      {/* Inbox: pass selectedLeadId when conversation list exists; for now null */}
      <div className="max-w-2xl">
        <MessagesInbox leadId={null} />
      </div>
    </div>
  )
}

