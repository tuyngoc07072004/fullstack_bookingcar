
export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
}

export interface CustomerState {
  currentCustomer: Customer | null;
  customers: Customer[];
  loading: boolean;
  error: string | null;
}