export interface DriverVehiclePayload {
  vehicle: {
    _id: string;
    vehicle_name: string;
    license_plate: string;
    seats: number;
    vehicle_type_id?: string;
    type_name: string;
    status?: string;
  };
  source: 'profile' | 'last_assignment';
}

export interface CreateDriverSelfBookingRequest {
  customerName: string;
  customerPhone: string;
  pickupCoords: { lat: number; lng: number };
  pickupAddressLabel?: string;
  dropoff: string;
  dropoffCoords: { lat: number; lng: number };
  tripDate?: string;
  passengers?: number;
}

export interface CreateDriverSelfBookingResponse {
  bookingId: string;
  assignmentId: string;
  booking: unknown;
  driver_snapshot: { name: string; phone: string };
  price: number;
  distance_km: number;
}
