import { getLeads } from '@/lib/actions/leads'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'

export default async function LeadsPage() {
  const leads = await getLeads()
  
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

