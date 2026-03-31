
export type VehicleStatus = 'ready' | 'not_started' | 'completed';
export type VehicleSeatCount = 4 | 7 | 9 | 16 | 29 | 45;

export interface Vehicle {
  _id: string;
  vehicle_name: string;
  license_plate: string;
  seats: VehicleSeatCount;
  vehicle_type: string;
  status: VehicleStatus;
  status_text: string;
  created_at: string;
  updated_at: string;
  is_ready?: boolean;
  is_completed?: boolean;
}

export interface VehicleFormData {
  vehicle_name: string;
  license_plate: string;
  seats: VehicleSeatCount;
  status?: VehicleStatus;
}

export interface VehicleUpdatePayload {
  vehicle_name?: string;
  license_plate?: string;
  seats?: VehicleSeatCount;
  status?: VehicleStatus;
}

export interface VehicleStatusUpdatePayload {
  status: VehicleStatus;
}

export interface VehicleStats {
  total: number;
  by_status: {
    'Chuẩn bị khởi hành': number;
    'Chưa khởi hành': number;
    'Đã hoàn thành chuyến đi': number;
  };
  by_seats: Array<{
    _id: VehicleSeatCount;
    count: number;
  }>;
}

export interface VehicleSearchParams {
  keyword?: string;
  status?: VehicleStatus;
  seats?: VehicleSeatCount;
  vehicle_type?: string;
  sortBy?: 'created_at' | 'vehicle_name' | 'license_plate' | 'seats' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VehicleSearchResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface VehicleFilters {
  status?: VehicleStatus;
  seats?: VehicleSeatCount;
  vehicle_type?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  total?: number;
}

// Vehicle type mapping
export const VEHICLE_SEAT_OPTIONS: { value: VehicleSeatCount; label: string }[] = [
  { value: 4, label: 'Xe 4 chỗ' },
  { value: 7, label: 'Xe 7 chỗ' },
  { value: 9, label: 'Xe 9 chỗ' },
  { value: 16, label: 'Xe 16 chỗ' },
  { value: 29, label: 'Xe 29 chỗ' },
  { value: 45, label: 'Xe 45 chỗ' },
];

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'ready', label: 'Chuẩn bị khởi hành' },
  { value: 'not_started', label: 'Chưa khởi hành' },
  { value: 'completed', label: 'Đã hoàn thành chuyến đi' },
];

export const getStatusText = (status: VehicleStatus): string => {
  const statusMap: Record<VehicleStatus, string> = {
    'ready': 'Chuẩn bị khởi hành',
    'not_started': 'Chưa khởi hành',
    'completed': 'Đã hoàn thành chuyến đi',
  };
  return statusMap[status] || status;
};

export const getVehicleTypeFromSeats = (seats: VehicleSeatCount): string => {
  const typeMap: Record<VehicleSeatCount, string> = {
    4: 'Xe 4 chỗ',
    7: 'Xe 7 chỗ',
    9: 'Xe 9 chỗ',
    16: 'Xe 16 chỗ',
    29: 'Xe 29 chỗ',
    45: 'Xe 45 chỗ',
  };
  return typeMap[seats] || 'Xe không xác định';
};

export const getStatusColor = (status: VehicleStatus): string => {
  const colorMap: Record<VehicleStatus, string> = {
    'ready': '#10B981',
    'not_started': '#F59E0B',
    'completed': '#3B82F6',
  };
  return colorMap[status];
};