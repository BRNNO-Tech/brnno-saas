export const dynamic = 'force-dynamic'

import { getServices } from '@/lib/actions/services'
import AddServiceButton from '@/components/services/add-service-button'
import ServiceList from '@/components/services/service-list'

export default async function ServicesPage() {
  let services
  try {
    services = await getServices()
  } catch (error) {
    console.error('Error loading services:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load services
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading services.'}
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
            Services
          </h1>
          <p className="mt-2 text-zinc-400">
            Manage your service catalog
          </p>
        </div>
        <AddServiceButton />
      </div>
      
      <ServiceList services={services} />
    </div>
  )
}

