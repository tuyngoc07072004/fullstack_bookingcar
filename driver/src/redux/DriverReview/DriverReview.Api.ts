import axios from 'axios';
import { getApiUrl } from '../../utils/dbUrl';
import { DriverReview, CreateReviewPayload, DriverReviewsResponse } from '../../types/DriverReview.types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const apiClient = axios.create({
  baseURL: getApiUrl(''),
  timeout: 10000,
});

/**
 * Tạo đánh giá tài xế (không cần auth)
 * POST /api/reviews
 */
export const createReview = async (payload: CreateReviewPayload): Promise<DriverReview> => {
  const response = await apiClient.post<ApiResponse<DriverReview>>('/reviews', {
    bookingId: payload.bookingId,
    rating: payload.rating,
    comment: payload.comment,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Tạo đánh giá thất bại');
  }
  return response.data.data;
};

/**
 * Kiểm tra booking đã được đánh giá chưa
 * GET /api/reviews/booking/:bookingId
 * Trả về DriverReview hoặc null
 */
export const getReviewByBooking = async (bookingId: string): Promise<DriverReview | null> => {
  const response = await apiClient.get<ApiResponse<DriverReview | null>>(`/reviews/booking/${bookingId}`);
  return response.data.data ?? null;
};

/**
 * Lấy tất cả đánh giá của một tài xế
 * GET /api/reviews/driver/:driverId
 */
export const getDriverReviews = async (driverId: string): Promise<DriverReviewsResponse> => {
  const response = await apiClient.get<ApiResponse<DriverReviewsResponse>>(`/reviews/driver/${driverId}`);
  return response.data.data ?? { reviews: [], total: 0, avgRating: 0 };
};
