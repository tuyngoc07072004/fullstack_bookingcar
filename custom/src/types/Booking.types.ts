export interface BookingCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface BookingData {
  pickup: string;
  dropoff: string;
  pickupCoords?: {
    lat: number;
    lng: number;
  };
  dropoffCoords?: {
    lat: number;
    lng: number;
  };
  date: string;
  passengers: number;
  seats: number;
  distance?: number;
  price?: number;
  paymentMethod: 'cash' | 'transfer';
  notes?: string;
}
export interface CreateBookingRequest {
  customer: BookingCustomer;
  booking: BookingData;
}

export interface Booking {
  _id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null; // FIXED: Allow null
  customer_id?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_coords?: {
    lat: number;
    lng: number;
  };
  dropoff_coords?: {
    lat: number;
    lng: number;
  };
  distance?: number;
  trip_date: string;
  formatted_date?: string;
  passengers: number;
  seats: number;
  vehicle_type_id: string;
  price: number;
  payment_method: 'cash' | 'transfer';
  payment_method_text?: string;
  payment_status?: 'pending' | 'paid_cash' | 'paid_transfer';
  paid_at?: string | null;
  status: 'pending' | 'confirmed' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  status_text?: string;
  low_occupancy_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  vehicleType?: {
    _id: string;
    type_name: string;
    seats: number;
  };
  tripAssignment?: {
    _id: string;
    driver?: {
      name: string;
      phone: string;
    };
    vehicle?: {
      vehicle_name: string;
      license_plate: string;
    };
  };
}

export interface BookingStatus {
  id: string;
  status: string;
  status_text: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  dropoff_location: string;
  trip_date: string;
  formatted_date: string;
  passengers: number;
  seats: number;
  vehicle_type: string;
  price: number;
  payment_method: string;
  driver: {
    name: string;
    phone: string;
  } | null;
  vehicle: {
    name: string;
    license_plate: string;
  } | null;
}

export interface PriceCalculationRequest {
  seats: number;
  distance: number;
  passengers?: number;
}

export interface PriceCalculationResponse {
  price: number;
  seats: number;
  vehicle_type: string;
  distance: number;
  passengers?: number;
  base_fare?: number;
  per_km_per_person?: number;
  variable_fare?: number;
  min_fare?: number;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface BookingState {
  currentBooking: Booking | null;
  bookings: Booking[];
  bookingStatus: BookingStatus | null;
  priceCalculation: PriceCalculationResponse | null;
  loading: boolean;
  error: string | null;
}

export interface BookingFormData {
  customer: BookingCustomer;
  booking: BookingData;
}