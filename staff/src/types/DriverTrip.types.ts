export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
export type DriverStatus = 'active' | 'inactive' | 'busy';

export type TripAssignmentSource = 'staff' | 'driver';
export type HistoryFilter = 'all' | TripAssignmentSource;

export interface DriverTrip {
  id: string;
  booking_id: string;
  driver_confirm: number; 
  booking_status: BookingStatus;
  pickup_location: string;
  dropoff_location: string;
  customer_name?: string;
  customer_phone?: string;
  trip_date: string;
  total_occupancy: number;
  vehicle_seats: number;
  vehicle_name?: string;
  driver_notes?: string;
  assigned_at: string;
  start_time?: string | null;
  end_time?: string | null;
  /** staff: NV phân công; driver: tài xế tự tạo */
  assignment_source?: TripAssignmentSource;
  price?: number;
  payment_method?: 'cash' | 'transfer';
  payment_status?: 'pending' | 'paid_cash' | 'paid_transfer';
  paid_at?: string | null;
}

export interface DriverTripStats {
  totalTrips: number;
  completedTrips: number;
  earnings: number;
  rating: number;
}

export interface DriverStatusResponse {
  id: string;
  name: string;
  status: DriverStatus;
  role: string;
  updated_at: string;
}

export interface ConfirmTripPayload {
  assignmentId: string;
  bookingId: string;
  reason?: string;
}

export interface ConfirmTripResponse {
  assignmentId: string;
  bookingId: string;
  status: BookingStatus;
  status_text: string;
}

export interface CompleteTripResponse {
  bookingId: string;
  assignmentId: string;
  status: BookingStatus;
  status_text: string;
}

export interface DriverTripState {
  trips: DriverTrip[];
  stats: DriverTripStats | null;
  driverStatus: DriverStatusResponse | null;
  loading: boolean;
  error: string | null;
}

// Status text mapping
export const BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  assigned: 'Đã phân công',
  'in-progress': 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const DRIVER_STATUS_TEXT: Record<DriverStatus, string> = {
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  busy: 'Đang bận'
};

export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  busy: 'bg-orange-100 text-orange-800'
};

export interface TripAssignment {
  _id: string;
  booking_id: {
    _id: string;
    pickup_location: string;
    dropoff_location: string;
    trip_date: string;
    passengers: number;
    seats: number;
    status: BookingStatus;
    vehicleType?: {
      type_name: string;
    };
    vehicle_type_id?: {
      type_name: string;
    };
  };
  driver_confirm: number;
  low_occupancy_reason?: string;
  assigned_at: string;
  start_time?: string;
  end_time?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}