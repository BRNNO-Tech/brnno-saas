import { getLeads } from '@/lib/actions/leads'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'

export default async function LeadsPage() {
  let leads
  try {
    leads = await getLeads()
  } catch (error) {
    console.error('Error loading leads:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load leads
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading leads.'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Track potential customers and follow-ups
          </p>
        </div>
        <AddLeadButton />
      </div>
      
      <LeadList leads={leads} />
    </div>
  )
}

