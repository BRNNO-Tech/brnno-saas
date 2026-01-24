export const dynamic = 'force-dynamic'

import { getClients } from '@/lib/actions/clients'
import AddClientButton from '@/components/clients/add-client-button'
import ClientList from '@/components/clients/client-list'

export default async function ClientsPage() {
  let clients
  try {
    clients = await getClients()
  } catch (error) {
    console.error('Error loading clients:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load clients
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading clients.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Clients
          </h1>
          <p className="mt-2 text-zinc-400">
            Manage your clients and their information.
          </p>
        </div>
        <AddClientButton />
      </div>

      <ClientList clients={clients} />
    </div>
  )
}

