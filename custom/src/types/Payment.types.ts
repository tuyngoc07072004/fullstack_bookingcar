export type PaymentMethod = 'cash' | 'transfer';
export type PaymentStatus = 'pending' | 'paid_cash' | 'paid_transfer';

export interface PaymentRecord {
  paymentId: string | null;
  booking_id?: string;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at?: string | null;
}

export interface PaymentCreateResponse {
  paymentId: string;
  bookingId: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  qrCode: string | null;
  payUrl: string | null;
  orderId?: string;
  requestId?: string;
}

export interface ConfirmCashPaymentResponse {
  paymentId: string;
  payment_status: PaymentStatus;
  paid_at: string;
}

export interface PaymentApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

