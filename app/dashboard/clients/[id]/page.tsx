export const dynamic = 'force-dynamic'

import { getClient } from '@/lib/actions/clients'
import ClientDetailView from '@/components/clients/client-detail-view'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    
    if (!id) {
      console.error('No client ID provided')
      notFound()
      return
    }
    
    const client = await getClient(id)

    return (
      <div className="p-6">
        <ClientDetailView client={client} />
      </div>
    )
  } catch (error) {
    // Log error with more details
    console.error('Error loading client:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.toString() : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    notFound()
  }
}

