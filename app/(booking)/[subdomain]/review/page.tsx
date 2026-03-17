import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getReviewRequestByToken } from '@/lib/actions/reviews'
import { ReviewForm } from './review-form'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const sp = await searchParams
  const token = sp?.token
  if (!token) return { title: 'Leave a review' }
  const request = await getReviewRequestByToken(token)
  const title = request ? `Leave a review – ${request.business_name}` : 'Leave a review'
  return { title }
}

export default async function ReviewPage({ params, searchParams }: Props) {
  const { subdomain } = await params
  const sp = await searchParams
  const token = sp?.token

  if (!token) {
    notFound()
  }

  const request = await getReviewRequestByToken(token)
  if (!request) {
    notFound()
  }

  if (request.subdomain !== subdomain) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <ReviewForm
          subdomain={request.subdomain}
          reviewRequestId={request.id}
          businessId={request.business_id}
          customerName={request.customer_name}
          businessName={request.business_name}
          primaryColor={request.primary_color}
          googleReviewLink={request.google_review_link}
        />
      </div>
    </div>
  )
}
