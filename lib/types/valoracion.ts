export type RatingStatus = 'pending' | 'approved' | 'rejected';

export interface Valoracion {
  id: string;
  comunidad_id: string;
  user_id: string;
  stars: number;
  review: string | null;
  status: RatingStatus;
  created_at: string;
  updated_at: string;
}

export interface RatingSummaryData {
  average: number;
  count: number;
}
