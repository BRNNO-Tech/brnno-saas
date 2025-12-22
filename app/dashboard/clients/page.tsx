import { getClients } from '@/lib/actions/clients'
import AddClientButton from '@/components/clients/add-client-button'
import ClientList from '@/components/clients/client-list'

export default async function ClientsPage() {
  const clients = await getClients()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Clients
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your clients and their information.
          </p>
        </div>
        <AddClientButton />
      </div>
      
      <ClientList clients={clients} />
    </div>
  )
}

