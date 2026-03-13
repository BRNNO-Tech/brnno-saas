import { getWorkerProfile } from '@/lib/actions/worker-auth'
import { redirect } from 'next/navigation'
import { WorkerMessagesInbox } from '@/components/worker/worker-messages-inbox'

export const dynamic = 'force-dynamic'

export default async function WorkerMessagesPage() {
  const worker = await getWorkerProfile()

  if (!worker) {
    redirect('/login')
  }

  return (
    <>
      <header className="bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Messages
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Communicate with managers and customers
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-[calc(100vh-12rem)]">
        <WorkerMessagesInbox
          teamMemberId={worker.id}
          businessId={worker.business_id}
          workerName={worker.name}
        />
      </div>
    </>
  )
}
