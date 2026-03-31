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

export const getReviewByBooking = async (bookingId: string): Promise<DriverReview | null> => {
  const response = await apiClient.get<ApiResponse<DriverReview | null>>(`/reviews/booking/${bookingId}`);
  return response.data.data ?? null;
};


export const getDriverReviews = async (driverId: string): Promise<DriverReviewsResponse> => {
  const response = await apiClient.get<ApiResponse<DriverReviewsResponse>>(`/reviews/driver/${driverId}`);
  return response.data.data ?? { reviews: [], total: 0, avgRating: 0 };
};
