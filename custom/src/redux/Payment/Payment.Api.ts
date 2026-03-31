import { getApiUrl } from '../../utils/dbUrl';
import {
  PaymentApiResponse,
  PaymentCreateResponse,
  PaymentRecord,
  PaymentStatus,
  ConfirmCashPaymentResponse,
} from '../../types/Payment.types';

const getAuthToken = (): string | null => {
  return localStorage.getItem('staffToken') || localStorage.getItem('driverToken') || sessionStorage.getItem('driverToken');
};

const handleResponse = async <T>(response: Response): Promise<PaymentApiResponse<T>> => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Có lỗi xảy ra');
  }
  return data;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const paymentApi = {
  async createPaymentForBooking(bookingId: string): Promise<PaymentApiResponse<PaymentCreateResponse>> {
    const response = await fetch(getApiUrl(`/payments/booking/${bookingId}/create`), {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<PaymentCreateResponse>(response);
  },

  async createTransferPaymentForBooking(bookingId: string): Promise<PaymentApiResponse<PaymentCreateResponse>> {
    const response = await fetch(getApiUrl(`/payments/booking/${bookingId}/create-transfer`), {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<PaymentCreateResponse>(response);
  },

  async getPaymentStatus(bookingId: string): Promise<PaymentApiResponse<PaymentRecord>> {
    const response = await fetch(getApiUrl(`/payments/booking/${bookingId}/status`), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse<PaymentRecord>(response);
  },

  async confirmCashPayment(
    bookingId: string
  ): Promise<PaymentApiResponse<ConfirmCashPaymentResponse>> {
    const response = await fetch(getApiUrl(`/payments/booking/${bookingId}/confirm-cash`), {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse<ConfirmCashPaymentResponse>(response);
  },
};

