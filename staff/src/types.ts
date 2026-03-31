export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface VehicleType {
  id: number;
  type_name: string;
  seats: number;
  base_price?: number;
  price_per_km?: number;
}

export interface Booking {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  email?: string;
  pickup_location: string;
  dropoff_location: string;
  trip_date: string;
  passengers: number;
  vehicle_type_id: number;
  vehicle_type?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  low_occupancy_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  status: 'active' | 'inactive' | 'busy';
  username?: string;
  created_at: string;
  updated_at?: string;
}

export interface Vehicle {
  id: number;
  vehicle_type_id: number;
  license_plate: string;
  status: 'available' | 'busy' | 'maintenance';
  type_name?: string;
  seats?: number;
  created_at: string;
  updated_at?: string;
}

export interface TripAssignment {
  id: number;
  booking_id: number;
  driver_id: number;
  vehicle_id: number;
  staff_id: number;
  driver_confirm: number;
  assigned_at: string;
  pickup_location?: string;
  dropoff_location?: string;
  trip_date?: string;
  booking_status?: string;
  license_plate?: string;
  vehicle_seats?: number;
  total_occupancy?: number; 
  low_occupancy_reason?: string;
  start_time?: string;
  end_time?: string;
}

export interface OccupancyData {
  vehicle_id: number;
  vehicle_license: string;
  vehicle_type: string;
  vehicle_seats: number;
  total_passengers: number;
  bookings: {
    booking_id: number;
    passengers: number;
    pickup: string;
    dropoff: string;
  }[];
}

export interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  in_progress_bookings: number;
  completed_bookings: number;
  total_customers: number;
  total_drivers: number;
  total_vehicles: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}