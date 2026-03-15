import type { Valoracion, RatingSummaryData } from './types/valoracion';

export interface RatingInput {
  stars: number;
  review?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRating(input: RatingInput): ValidationResult {
  if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
    return { valid: false, error: 'stars must be an integer between 1 and 5' };
  }
  if (input.review != null && input.review.length > 1000) {
    return { valid: false, error: 'review must not exceed 1000 characters' };
  }
  return { valid: true };
}

export function computeSummary(approvedStars: number[]): RatingSummaryData | null {
  if (approvedStars.length === 0) return null;
  const sum = approvedStars.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / approvedStars.length) * 10) / 10;
  return { average, count: approvedStars.length };
}

export function sortByDateDesc(reviews: Valoracion[]): Valoracion[] {
  return [...reviews].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
