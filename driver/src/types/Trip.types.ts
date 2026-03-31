export type TripStatus = 'scheduled' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface PickupPoint {
  location: string;
  coords?: {
    lat: number;
    lng: number;
  };
  time?: string;
  booking_id?: string;
}

export interface DropoffPoint {
  location: string;
  coords?: {
    lat: number;
    lng: number;
  };
  time?: string;
  booking_id?: string;
}

export interface TripBooking {
  booking_id: string;
  passengers: number;
  pickup_point: string;
  dropoff_point: string;
  price: number;
  customer_name: string;
  customer_phone: string;
  booking_details?: any;
}

export interface Trip {
  _id: string;
  trip_code: string;
  vehicle_id: string | {
    _id: string;
    vehicle_name: string;
    license_plate: string;
    seats: number;
    status: string;
    status_text?: string;
  };
  driver_id: string | {
    _id: string;
    name: string;
    phone: string;
    license_number: string;
    status: string;
    status_text?: string;
  };
  staff_id: string | {
    _id: string;
    name: string;
    username: string;
  };
  route: string;
  pickup_points: PickupPoint[];
  dropoff_points: DropoffPoint[];
  departure_time: string;
  estimated_arrival_time?: string;
  actual_arrival_time?: string;
  total_passengers: number;
  max_passengers: number;
  status: TripStatus;
  status_text?: string;
  bookings: TripBooking[];
  notes?: string;
  created_at: string;
  updated_at: string;
  available_seats?: number;
  has_available_seats?: boolean;
}

export interface TripWithPopulated extends Omit<Trip, 'vehicle_id' | 'driver_id' | 'staff_id'> {
  vehicle_id: {
    _id: string;
    vehicle_name: string;
    license_plate: string;
    seats: number;
    status: string;
    status_text?: string;
  };
  driver_id: {
    _id: string;
    name: string;
    phone: string;
    license_number: string;
    status: string;
    status_text?: string;
  };
  staff_id: {
    _id: string;
    name: string;
    username: string;
  };
}

export interface SimpleVehicle {
  _id: string;
  vehicle_name: string;
  license_plate: string;
  seats: number;
  status: string;
}

export interface SimpleDriver {
  _id: string;
  name: string;
  phone: string;
  license_number: string;
  status: string;
}

export interface SimpleStaff {
  _id: string;
  name: string;
  username: string;
}

export interface TripFilters {
  status?: TripStatus | 'all';
  date?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface TripListResponse {
  trips: Trip[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TripStats {
  total: number;
  scheduled: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  today: number;
  week: number;
  total_passengers: number;
  avg_passengers_per_trip: number;
}

export interface AssignBookingPayload {
  driverId: string;
  vehicleId: string;
  forceNewTrip?: boolean;
  preferExistingTrip?: boolean;
}

export interface AssignBookingResponse {
  trip: Trip;
  booking: {
    id: string;
    status: string;
    status_text: string;
  };
  isNewTrip: boolean;
  message: string;
}

export interface FindSuitableTripsResponse {
  booking: {
    id: string;
    seats: number;
    passengers: number;
    trip_date: string;
    pickup: string;
    dropoff: string;
  };
  trips: Array<{
    id: string;
    trip_code: string;
    vehicle: SimpleVehicle;
    driver: SimpleDriver;
    departure_time: string;
    current_passengers: number;
    available_seats: number;
    bookings_count: number;
    route: string;
    pickup_points: PickupPoint[];
    dropoff_points: DropoffPoint[];
  }>;
  total: number;
}

export interface UpdateTripStatusPayload {
  status: TripStatus;
}

export interface TripBookingsResponse {
  trip_id: string;
  trip_code: string;
  total_passengers: number;
  max_passengers: number;
  bookings: any[];
}

export interface RemoveBookingFromTripResponse {
  trip_id: string;
  booking_id: string;
  remaining_bookings: number;
}

export interface TripState {
  trips: Trip[];
  currentTrip: TripWithPopulated | null;
  stats: TripStats | null;
  suitableTrips: FindSuitableTripsResponse | null;
  tripBookings: any[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: TripFilters;
}

export const TRIP_STATUS_OPTIONS: { value: TripStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'scheduled', label: 'Đã lên lịch' },
  { value: 'assigned', label: 'Đã phân công' },
  { value: 'in-progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-800',
  assigned: 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const TRIP_STATUS_TEXT: Record<TripStatus, string> = {
  scheduled: 'Đã lên lịch',
  assigned: 'Đã phân công',
  'in-progress': 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};