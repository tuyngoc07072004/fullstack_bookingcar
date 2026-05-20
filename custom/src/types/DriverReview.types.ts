export interface DriverReview {
  _id: string;
  booking_id: string;
  driver_id: string;
  customer_id?: string | null;
  customer_name: string;
  rating: number; // 1-5
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface DriverReviewsResponse {
  reviews: DriverReview[];
  total: number;
  avgRating: number;
}

// NEW: Response for checking if can review
export interface CanReviewResponse {
  canReview: boolean;
  isCompleted: boolean;
  hasReviewed: boolean;
  hasDriver: boolean;
  bookingStatus: string;
  bookingStatusText: string;
}

export interface DriverReviewState {
  // key: bookingId → review (null nếu chưa đánh giá, undefined nếu chưa fetch)
  reviewsByBooking: Record<string, DriverReview | null>;
  // NEW: cache for canReview status
  canReviewStatus: Record<string, CanReviewResponse>;
  submitting: boolean;
  loading: boolean;
  error: string | null;

  // Dành riêng cho Driver Dashboard
  driverReviews: DriverReview[];
  driverReviewStats: { total: number; avgRating: number };
  loadingDriverReviews: boolean;
}