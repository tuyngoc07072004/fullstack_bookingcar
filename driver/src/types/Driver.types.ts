export interface Driver {
  _id: string;
  name: string;
  phone: string;
  license_number: string;
  status: 'active' | 'inactive' | 'busy';
  username: string;
  created_at: string;
  updated_at?: string;
}

export interface DriverRegisterPayload {
  name: string;
  phone: string;
  license_number: string;
  username: string;
  password: string;
}

export interface DriverLoginPayload {
  username: string;
  password: string;
}

export interface DriverLoginResponse {
  id: string;
  name: string;
  phone: string;
  license_number: string;
  username: string;
  status: string;
  token: string;
}

export interface DriverUpdateProfilePayload {
  name?: string;
  phone?: string;
  license_number?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Types mới cho Dashboard
export type BookingStatus = 'assigned' | 'in-progress' | 'completed' | 'cancelled';
export type DriverConfirmStatus = 0 | 1; // 0: chưa xác nhận, 1: đã xác nhận

export interface TripAssignment {
  id: number;
  booking_id: number;
  booking_status: BookingStatus;
  driver_confirm: DriverConfirmStatus;
  pickup_location: string;
  dropoff_location: string;
  trip_date?: string;
  total_occupancy: number;
  vehicle_seats: number;
  customer_name?: string;
  customer_phone?: string;
  distance?: number;
  estimated_fare?: number;
}

export interface DriverStats {
  totalTrips: number;
  completedTrips: number;
  earnings: number;
  rating: number;
  monthlyEarnings?: number;
  weeklyEarnings?: number;
  cancellationRate?: number;
  acceptanceRate?: number;
}

export interface LowOccupancyTrip {
  assignmentId: number;
  bookingId: number;
}

export interface TripConfirmationPayload {
  assignmentId: number;
  bookingId: number;
  reason?: string;
}

export interface EarningsDataPoint {
  date: string;
  earnings: number;
}

export interface DriverDashboardStats extends DriverStats {
  onlineHours?: number;
  distanceDriven?: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface TripFilters {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}


