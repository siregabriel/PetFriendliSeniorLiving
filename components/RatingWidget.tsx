'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RatingWidgetProps {
  comunidadId: string;
  existingRating?: { stars: number; review: string | null };
  isAuthenticated: boolean;
}

export default function RatingWidget({ comunidadId, existingRating, isAuthenticated }: RatingWidgetProps) {
  const [selectedStars, setSelectedStars] = useState<number>(existingRating?.stars ?? 0);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [review, setReview] = useState<string>(existingRating?.review ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 underline hover:text-blue-800">
          Sign in
        </Link>{' '}
        to rate this community.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedStars === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comunidadId, stars: selectedStars, review: review || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setReview('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-sm text-green-600">
        Your rating has been submitted and is pending review. Thank you!
      </div>
    );
  }

  const displayStars = hoveredStars || selectedStars;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Star selector */}
      <div className="flex gap-1" role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            onClick={() => setSelectedStars(star)}
            onMouseEnter={() => setHoveredStars(star)}
            onMouseLeave={() => setHoveredStars(0)}
            className={`text-2xl transition-colors ${
              star <= displayStars ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Review textarea */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
        placeholder="Share your experience (optional)"
        rows={3}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <div className="text-xs text-gray-400 text-right">{review.length}/1000</div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={selectedStars === 0 || submitting}
        className="self-start rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting…' : existingRating ? 'Update Rating' : 'Submit Rating'}
      </button>
    </form>
  );
}
