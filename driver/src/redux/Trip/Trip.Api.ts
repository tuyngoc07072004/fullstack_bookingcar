import { getApiUrl } from '../../utils/dbUrl';
import {
  Trip,
  TripFilters,
  TripListResponse,
  TripStats,
  AssignBookingPayload,
  AssignBookingResponse,
  FindSuitableTripsResponse,
  UpdateTripStatusPayload,
  TripBookingsResponse,
  RemoveBookingFromTripResponse,
} from '../../types/Trip.types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class TripApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl('/trips');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('staffToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge với headers từ options
    const mergedHeaders = {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    };

    const config: RequestInit = {
      ...options,
      headers: mergedHeaders,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Đã xảy ra lỗi',
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể kết nối đến server',
      };
    }
  }

  /**
   * Lấy danh sách chuyến đi
   */
  async getAllTrips(filters: TripFilters = {}): Promise<ApiResponse<TripListResponse>> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.date) {
      params.append('date', filters.date);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/?${queryString}` : '/';
    
    return this.request<TripListResponse>(endpoint);
  }

  /**
   * Lấy chi tiết chuyến đi theo ID
   */
  async getTripById(id: string): Promise<ApiResponse<Trip>> {
    return this.request<Trip>(`/${id}`);
  }

  /**
   * Lấy danh sách bookings trong chuyến đi
   */
  async getTripBookings(id: string): Promise<ApiResponse<TripBookingsResponse>> {
    return this.request<TripBookingsResponse>(`/${id}/bookings`);
  }

  /**
   * Cập nhật trạng thái chuyến đi
   */
  async updateTripStatus(
    id: string,
    payload: UpdateTripStatusPayload
  ): Promise<ApiResponse<{ trip: Trip; old_status: string; new_status: string }>> {
    return this.request(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Phân công booking vào chuyến đi
   */
  async assignBooking(
    bookingId: string,
    payload: AssignBookingPayload
  ): Promise<ApiResponse<AssignBookingResponse>> {
    return this.request(`/assign-booking/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Tìm chuyến đi phù hợp cho booking
   */
  async findSuitableTrips(bookingId: string): Promise<ApiResponse<FindSuitableTripsResponse>> {
    return this.request(`/find-trips/${bookingId}`);
  }

  /**
   * Xóa booking khỏi chuyến đi
   */
  async removeBookingFromTrip(
    tripId: string,
    bookingId: string
  ): Promise<ApiResponse<RemoveBookingFromTripResponse>> {
    return this.request(`/${tripId}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Lấy thống kê chuyến đi
   */
  async getTripStats(): Promise<ApiResponse<TripStats>> {
    return this.request('/stats');
  }
}

export const tripApi = new TripApi();
export default tripApi;