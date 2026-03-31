import { getApiUrl } from '../../utils/dbUrl';
import { 
  CreateBookingRequest, 
  Booking, 
  PriceCalculationRequest, 
  PriceCalculationResponse,
  CancelBookingRequest,
  BookingStatus
} from '../../types/Booking.types';

class BookingApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl('/bookings');
  }

  async calculatePrice(data: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calculate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Không thể tính giá');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ Lỗi tính giá:', error);
      throw error;
    }
  }

  async createBooking(data: CreateBookingRequest): Promise<{ bookingId: string; booking: Booking }> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json() as {
        success: boolean;
        message?: string;
        data?: { bookingId: string; booking: Booking };
        error?: string;
      };
      
      if (!result.success) {
        const detail = typeof result.error === 'string' && result.error ? `: ${result.error}` : '';
        throw new Error(`${result.message || 'Không thể tạo đơn đặt xe'}${detail}`);
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Lỗi tạo booking:', error);
      throw error;
    }
  }

  async getBookingById(id: string): Promise<Booking> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Không tìm thấy đơn đặt xe');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ Lỗi lấy booking:', error);
      throw error;
    }
  }

  async getBookingsByPhone(phone: string): Promise<Booking[]> {
    try {
      const response = await fetch(`${this.baseUrl}/phone/${phone}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Không thể lấy danh sách đơn đặt xe');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách booking:', error);
      throw error;
    }
  }

  async checkBookingStatus(id: string, phone?: string): Promise<BookingStatus> {
    try {
      let url = `${this.baseUrl}/status/${id}`;
      if (phone) {
        url += `?phone=${phone}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Không thể kiểm tra trạng thái đơn đặt xe');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra trạng thái:', error);
      throw error;
    }
  }

  async cancelBooking(id: string, data?: CancelBookingRequest): Promise<{ bookingId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Không thể hủy đơn đặt xe');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ Lỗi hủy booking:', error);
      throw error;
    }
  }
}

export default new BookingApi();