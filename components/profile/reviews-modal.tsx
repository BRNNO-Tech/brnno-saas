'use client'

import { Star, X } from 'lucide-react'

export type ReviewForModal = {
  id: string
  rating: number
  comment: string | null
  customer_name: string | null
  created_at: string
}

type ReviewsModalProps = {
  open: boolean
  onClose: () => void
  reviews: ReviewForModal[]
  businessName: string
  primaryColor: string
}

export function ReviewsModal({
  open,
  onClose,
  reviews,
  businessName,
  primaryColor,
}: ReviewsModalProps) {
  if (!open) return null

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '0'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity sm:bg-black/40"
        aria-hidden
        onClick={onClose}
      />

      {/* Bottom sheet (mobile) / centered modal (desktop) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[80vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-modal-title"
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 pb-4 pt-2 sm:px-6 sm:pt-6">
          <div>
            <h2 id="reviews-modal-title" className="text-lg font-bold text-zinc-900">
              {businessName}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex gap-0.5" style={{ color: primaryColor }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={i <= Math.round(Number(avgRating)) ? 'currentColor' : 'transparent'}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-zinc-700">{avgRating}</span>
              <span className="text-sm text-zinc-500">
                · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5" style={{ color: primaryColor }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4"
                        fill={i <= review.rating ? 'currentColor' : 'transparent'}
                      />
                    ))}
                  </div>
                  {review.customer_name && (
                    <span className="text-sm font-medium text-zinc-700">
                      {review.customer_name}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-zinc-400">
                    {new Date(review.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
