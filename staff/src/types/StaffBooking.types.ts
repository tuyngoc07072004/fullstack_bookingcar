import { Booking } from './Booking.types';
import { Driver } from './Driver.types';
import { Vehicle } from './Vehicle.types';
import { Staff } from './Staff.types';

export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface TripAssignment {
  _id: string;
  booking_id: string;
  driver_id?: string;
  vehicle_id?: string;
  staff_id?: string;
  driver_confirm: number;
  low_occupancy_reason?: string;
  assigned_at: string;
  start_time?: string;
  end_time?: string;
  driver?: {
    _id: string;
    name: string;
    phone: string;
  };
  vehicle?: {
    _id: string;
    vehicle_name: string;
    license_plate: string;
    seats: number;
  };
  staff?: {
    _id: string;
    name: string;
    username: string;
  };
}

// Staff Booking extends Booking
export interface StaffBooking extends Omit<Booking, 'tripAssignment'> {
  tripAssignment?: TripAssignment;
  vehicleType?: {
    _id: string;
    type_name: string;
    seats: number;
    base_price?: number;
    price_per_km?: number;
  };
}

// Booking Statistics
export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  today: number;
  week: number;
  month: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
}

// Booking Filters
export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Booking List Response
export interface BookingListResponse {
  bookings: StaffBooking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Booking Details For Staff
export interface BookingDetailsForStaff {
  booking: StaffBooking & {
    formatted_date?: string;
    status_text?: string;
    payment_method_text?: string;
  };
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
  canAssign: boolean;
}

// Confirm Booking Payload
export interface ConfirmBookingPayload {
  notes?: string;
}

// Confirm Booking Response
export interface ConfirmBookingResponse {
  bookingId: string;
  status: BookingStatus;
  status_text: string;
}

/** Cặp tài xế–xe đang có chuyến chưa kết thúc, còn chỗ trống để ghép thêm khách */
export interface CarpoolAssignmentOption {
  driver_id: string;
  driver: {
    _id: string;
    name: string;
    phone: string;
    status: string;
  };
  vehicle_id: string;
  vehicle: {
    _id: string;
    vehicle_name: string;
    license_plate: string;
    seats: number;
    status: string;
  };
  usedPassengers: number;
  availableSeats: number;
  activeBookings: Array<{
    bookingId: string;
    customer_name?: string;
    passengers: number;
    status: string;
  }>;
}

export interface ActiveTripOption {
  trip_id: string;
  trip_code: string;
  route: string;
  driver_id: string;
  driver: { name: string; phone: string };
  vehicle_id: string;
  vehicle: { vehicle_name: string; license_plate: string; seats: number };
  total_passengers: number;
  max_passengers: number;
  availableSeats: number;
  departure_time: string;
  bookings: Array<{
    booking_id: string;
    customer_name?: string;
    passengers: number;
    pickup_point?: string;
    dropoff_point?: string;
  }>;
}

export interface AssignmentOptionsResponse {
  carpools: CarpoolAssignmentOption[];
  activeTrips: ActiveTripOption[];
  idleDrivers: Driver[];
  readyVehicles: Vehicle[];
}

// Assign Driver Payload
export interface AssignDriverPayload {
  driverId: string;
  vehicleId: string;
  startTime?: string;
}

// Assign Response
export interface AssignResponse {
  assignment: {
    _id: string;
    booking_id: string;
    driver: {
      _id: string;
      name: string;
      phone: string;
    };
    vehicle: {
      _id: string;
      vehicle_name: string;
      license_plate: string;
      seats: number;
    };
    staff_id?: {
      _id: string;
      name: string;
      username: string;
    };
    start_time?: string;
    driver_confirm: number;
    assigned_at: string;
  };
  booking: {
    id: string;
    status: BookingStatus;
    status_text: string;
  };
}

// Update Status Payload
export interface UpdateStatusPayload {
  status: BookingStatus;
  reason?: string;
}

// Update Status Response
export interface UpdateStatusResponse {
  bookingId: string;
  status: BookingStatus;
  status_text: string;
}

// Staff Booking State for Redux
export interface StaffBookingState {
  bookings: StaffBooking[];
  currentBooking: StaffBooking | null;
  bookingDetails: BookingDetailsForStaff | null;
  stats: BookingStats | null;
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: BookingFilters;
}

// API Response
export interface StaffBookingApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Filter Options
export interface FilterOption {
  value: string;
  label: string;
}

// Booking Status Options
export const BOOKING_STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'assigned', label: 'Đã phân công' },
  { value: 'in-progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' }
];

// Status Colors
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Status Text
export const STATUS_TEXT: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  assigned: 'Đã phân công',
  'in-progress': 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
};