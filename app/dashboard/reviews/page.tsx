import { getReviewRequests } from '@/lib/actions/reviews'
import ReviewRequestList from '@/components/reviews/review-request-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function ReviewsPage() {
  let requests
  try {
    requests = await getReviewRequests()
  } catch (error) {
    console.error('Error loading review requests:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load review requests
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading review requests.'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Automation</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Automated review requests sent after job completion
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
      
      <ReviewRequestList requests={requests} />
    </div>
  )
}

