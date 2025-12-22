import { getReviewRequests } from '@/lib/actions/reviews'
import ReviewRequestList from '@/components/reviews/review-request-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function ReviewsPage() {
  const requests = await getReviewRequests()
  
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

