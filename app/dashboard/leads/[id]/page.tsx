import { getLead } from '@/lib/actions/leads'
import { notFound } from 'next/navigation'
import LeadDetailView from '@/components/leads/lead-detail-view'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const lead = await getLead(id)

    return (
      <div className="p-6">
        <LeadDetailView lead={lead} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}

