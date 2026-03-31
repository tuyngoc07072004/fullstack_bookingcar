// types/StaffCustomer.types.ts

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerBooking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  trip_date: string;
  formatted_date: string;
  passengers: number;
  seats: number;
  price: number;
  status: string;
  status_text: string;
  payment_method: string;
  payment_method_text: string;
  vehicle_type: string;
  driver: {
    name: string;
    phone: string;
  } | null;
  vehicle: {
    name: string;
    license_plate: string;
  } | null;
  created_at: string;
}

export interface CustomerStats {
  total_bookings: number;
  total_spent: number;
  completed_bookings: number;
  cancelled_bookings: number;
}

export interface CustomerWithDetails {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
  created_at: string;
}

export interface GetAllCustomersResponse {
  success: boolean;
  data: {
    customers: Customer[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
}

export interface GetCustomerBookingsResponse {
  success: boolean;
  data: {
    customer: CustomerWithDetails;
    stats: CustomerStats;
    bookings: CustomerBooking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
}

export interface GetAllCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetCustomerBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
}