'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, ExternalLink } from 'lucide-react'
import { submitReview } from '@/lib/actions/reviews'

type Props = {
  subdomain: string
  reviewRequestId: string
  businessId: string
  customerName: string | null
  businessName: string
  primaryColor: string
  googleReviewLink: string | null
}

export function ReviewForm({
  subdomain,
  reviewRequestId,
  businessId,
  customerName,
  businessName,
  primaryColor,
  googleReviewLink,
}: Props) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayRating = hoverRating || rating

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.')
      return
    }
    setError(null)
    setSubmitting(true)
    const result = await submitReview({
      reviewRequestId,
      businessId,
      customerName,
      customerEmail: null,
      rating,
      comment: comment.trim() || null,
    })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sm:p-8 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Star className="w-7 h-7" style={{ color: primaryColor }} fill={primaryColor} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">Thank you!</h1>
        <p className="text-zinc-600 mb-6">
          Your feedback helps us improve and helps other customers find us.
        </p>
        {googleReviewLink ? (
          <a
            href={googleReviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            Also leave a Google review
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : null}
        <Link
          href={`/${subdomain}`}
          className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to {businessName}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1">
        How was your experience?
      </h1>
      <p className="text-zinc-600 mb-6">
        {customerName ? `${customerName}, ` : ''}we&apos;d love your feedback.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">Rating</p>
          <div className="flex gap-1 justify-center sm:justify-start">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400"
                style={{ ['--ring-color' as string]: primaryColor }}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
              >
                <Star
                  className="w-10 h-10 sm:w-12 sm:h-12 transition-colors"
                  style={{
                    color: value <= displayRating ? primaryColor : 'var(--tw-zinc-300, #d4d4d8)',
                  }}
                  fill={value <= displayRating ? primaryColor : 'transparent'}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-700 mb-2">
            Comment <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-transparent resize-none"
            style={{ ['--tw-ring-color' as string]: primaryColor }}
            placeholder="Tell us what you liked or how we can improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 sm:py-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-70"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </div>
  )
}
