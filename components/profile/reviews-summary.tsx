'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { ReviewsModal, type ReviewForModal } from './reviews-modal'

type ReviewsSummaryProps = {
  reviews: ReviewForModal[]
  businessName: string
  primaryColor: string
}

export function ReviewsSummary({
  reviews,
  businessName,
  primaryColor,
}: ReviewsSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (reviews.length < 1) return null

  const avgRating = (
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  ).toFixed(1)
  const ratingRounded = Math.round(Number(avgRating))

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mb-4 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
        aria-label={`${avgRating} stars, ${reviews.length} reviews — view all reviews`}
      >
        <div className="flex gap-0.5" style={{ color: primaryColor }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="h-5 w-5"
              fill={i <= ratingRounded ? 'currentColor' : 'transparent'}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-white">
          {avgRating}
        </span>
        <span className="text-sm text-white/90">
          · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </button>

      <ReviewsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        reviews={reviews}
        businessName={businessName}
        primaryColor={primaryColor}
      />
    </>
  )
}
