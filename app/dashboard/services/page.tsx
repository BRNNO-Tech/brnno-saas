import { getServices } from '@/lib/actions/services'
import AddServiceButton from '@/components/services/add-service-button'
import ServiceList from '@/components/services/service-list'

export default async function ServicesPage() {
  const services = await getServices()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Services
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your service catalog
          </p>
        </div>
        <AddServiceButton />
      </div>
      
      <ServiceList services={services} />
    </div>
  )
}

