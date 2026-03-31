
export interface VehicleType {
  _id: string;
  type_name: string;
  seats: 4 | 7 | 9 | 16 | 29 | 45;
  base_price: number;
  price_per_km: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  type_text?: string;
}

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = [
  { _id: '4', type_name: 'Xe 4 chỗ', seats: 4, base_price: 1500000, price_per_km: 10000, is_active: true, created_at: '', updated_at: '' },
  { _id: '7', type_name: 'Xe 7 chỗ', seats: 7, base_price: 1800000, price_per_km: 11000, is_active: true, created_at: '', updated_at: '' },
  { _id: '9', type_name: 'Xe 9 chỗ', seats: 9, base_price: 2600000, price_per_km: 12000, is_active: true, created_at: '', updated_at: '' },
  { _id: '16', type_name: 'Xe 16 chỗ', seats: 16, base_price: 2000000, price_per_km: 9000, is_active: true, created_at: '', updated_at: '' },
  { _id: '29', type_name: 'Xe 29 chỗ', seats: 29, base_price: 3000000, price_per_km: 11000, is_active: true, created_at: '', updated_at: '' },
  { _id: '45', type_name: 'Xe 45 chỗ', seats: 45, base_price: 5700000, price_per_km: 20000, is_active: true, created_at: '', updated_at: '' }
];

export interface VehicleTypeState {
  vehicleTypes: VehicleType[];
  selectedVehicleType: VehicleType | null;
  loading: boolean;
  error: string | null;
}