export const dynamic = 'force-dynamic'

import { getClient } from '@/lib/actions/clients'
import ClientDetailView from '@/components/clients/client-detail-view'
import { notFound } from 'next/navigation'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    
    if (!id) {
      console.error('No customer ID provided')
      notFound()
      return
    }
    
    const client = await getClient(id)

    return (
      <div className="min-h-screen bg-[var(--dash-black)] text-[var(--dash-text)] -m-4 sm:-m-6">
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <ClientDetailView client={client} />
        </div>
      </div>
    )
  } catch (error) {
    // Log error with more details
    console.error('Error loading customer:', error)
    
    // Try to extract more information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause
      })
    } else {
      console.error('Non-Error object:', {
        type: typeof error,
        value: error,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
    }
    
    notFound()
  }
}
