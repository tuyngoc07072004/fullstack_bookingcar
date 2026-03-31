import { getApiUrl } from '../../utils/dbUrl';
import { 
  StaffBookingApiResponse, 
  BookingListResponse, 
  BookingStats, 
  BookingFilters,
  BookingDetailsForStaff,
  ConfirmBookingPayload,
  AssignDriverPayload,
  AssignResponse,
  ConfirmBookingResponse,
  UpdateStatusPayload,
  UpdateStatusResponse,
  AssignmentOptionsResponse
} from '../../types/StaffBooking.types'; 
import { Vehicle } from '../../types/Vehicle.types';
import { Driver } from '../../types/Driver.types';
import { Booking } from '../../types/Booking.types';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('staffToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async <T>(response: Response): Promise<StaffBookingApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Có lỗi xảy ra');
  }
  
  return data;
};

export const staffBookingApi = {
  /**
   * Lấy thống kê bookings
   */
  async getStats(): Promise<StaffBookingApiResponse<BookingStats>> {
    const response = await fetch(getApiUrl('/staff/bookings/stats'), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<BookingStats>(response);
  },

  /**
   * Lấy danh sách bookings với filter và pagination
   */
  async getBookings(filters: BookingFilters): Promise<StaffBookingApiResponse<BookingListResponse>> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const url = getApiUrl(`/staff/bookings${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<BookingListResponse>(response);
  },

  /**
   * Lấy chi tiết booking
   */
  async getBookingById(bookingId: string): Promise<StaffBookingApiResponse<Booking>> {
    const response = await fetch(getApiUrl(`/staff/bookings/${bookingId}`), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<Booking>(response);
  },

  /**
   * Lấy chi tiết booking cho staff (kèm danh sách xe/tài xế có sẵn)
   */
  async getBookingDetailsForStaff(bookingId: string): Promise<StaffBookingApiResponse<BookingDetailsForStaff>> {
    const response = await fetch(getApiUrl(`/staff/bookings/${bookingId}/details`), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<BookingDetailsForStaff>(response);
  },

  /**
   * Xác nhận booking
   */
  async confirmBooking(bookingId: string, payload: ConfirmBookingPayload): Promise<StaffBookingApiResponse<ConfirmBookingResponse>> {
    const response = await fetch(getApiUrl(`/staff/bookings/${bookingId}/confirm`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<ConfirmBookingResponse>(response);
  },

  /**
   * Tùy chọn phân công: chuyến ghép còn chỗ + tài xế rảnh Tài xế rảnh + xe ready
   */
  async getAssignmentOptions(seats?: number): Promise<StaffBookingApiResponse<AssignmentOptionsResponse>> {
    const params = seats != null ? `?seats=${seats}` : '';
    const response = await fetch(getApiUrl(`/staff/bookings/assignment-options${params}`), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<AssignmentOptionsResponse>(response);
  },

  /**
   * Phân công tài xế và xe
   */
  async assignDriverAndVehicle(bookingId: string, payload: AssignDriverPayload): Promise<StaffBookingApiResponse<AssignResponse>> {
    const response = await fetch(getApiUrl(`/staff/bookings/${bookingId}/assign`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<AssignResponse>(response);
  },

  /**
   * Cập nhật trạng thái booking
   */
  async updateBookingStatus(bookingId: string, payload: UpdateStatusPayload): Promise<StaffBookingApiResponse<UpdateStatusResponse>> {
    const response = await fetch(getApiUrl(`/staff/bookings/${bookingId}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<UpdateStatusResponse>(response);
  },

  /**
   * Lấy danh sách xe có sẵn theo số ghế
   */
  async getAvailableVehicles(seats?: number): Promise<StaffBookingApiResponse<Vehicle[]>> {
    const params = seats ? `?seats=${seats}` : '';
    const response = await fetch(getApiUrl(`/staff/bookings/vehicles/available${params}`), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<Vehicle[]>(response);
  },

  /**
   * Lấy danh sách tài xế có sẵn
   */
  async getAvailableDrivers(): Promise<StaffBookingApiResponse<Driver[]>> {
    const response = await fetch(getApiUrl('/staff/bookings/drivers/available'), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<Driver[]>(response);
  }
};

export default staffBookingApi;