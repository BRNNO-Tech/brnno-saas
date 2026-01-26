// Reviews feature temporarily disabled - file not currently in use
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Mail, MessageSquare, CheckCircle } from 'lucide-react'
import { deleteReviewRequest, updateReviewRequestStatus } from '@/lib/actions/reviews'

type ReviewRequest = {
  id: string
  status: string
  send_at: string
  sent_at: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  review_link: string | null
  job: { title: string } | null
  created_at: string
}

export default function ReviewRequestList({ requests }: { requests: ReviewRequest[] }) {
  async function handleDelete(id: string) {
    if (!confirm('Delete this review request?')) return

    try {
      await deleteReviewRequest(id)
    } catch (error) {
      console.error('Error deleting review request:', error)
      alert('Failed to delete review request')
    }
  }

  async function handleMarkAsSent(id: string) {
    try {
      await updateReviewRequestStatus(id, 'sent')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  async function handleMarkAsCompleted(id: string) {
    try {
      await updateReviewRequestStatus(id, 'completed')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No review requests yet. Complete a job to trigger automatic review requests.
        </p>
      </Card>
    )
  }

  const pending = requests.filter(r => r.status === 'pending')
  const sent = requests.filter(r => r.status === 'sent')
  const completed = requests.filter(r => r.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-semibold">{request.customer_name}</h3>
                      <Badge variant="outline">Pending</Badge>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Job: {request.job?.title || 'Unknown'}
                    </p>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Scheduled to send: {new Date(request.send_at).toLocaleString()}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {request.customer_phone && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {request.customer_phone}
                        </div>
                      )}
                      {request.customer_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {request.customer_email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsSent(request.id)}
                    >
                      Mark as Sent
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent */}
      {sent.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Sent ({sent.length})</h2>
          <div className="space-y-3">
            {sent.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-semibold">{request.customer_name}</h3>
                      <Badge variant="secondary">Sent</Badge>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Job: {request.job?.title || 'Unknown'}
                    </p>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Sent: {request.sent_at ? new Date(request.sent_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsCompleted(request.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completed
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">
            Completed Reviews ({completed.length})
          </summary>
          <div className="mt-4 space-y-3">
            {completed.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                <div>
                  <p className="font-medium">{request.customer_name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {request.job?.title || 'Unknown job'}
                  </p>
                </div>
                <Badge>Completed</Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

