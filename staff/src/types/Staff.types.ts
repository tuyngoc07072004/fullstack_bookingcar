export interface Staff {
  _id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  created_at: string;
  updated_at?: string;
}

export interface StaffLoginPayload {
  username?: string;
  email?: string;
  password: string;
}

export interface StaffRegisterPayload {
  name: string;
  phone: string;
  email: string;
  username: string;
  password: string;
}

export interface StaffAuthResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    phone: string;
    email: string;
    username: string;
    token: string;
  };
}

export interface StaffResponse {
  success: boolean;
  message?: string;
  data: Staff;
}

export interface StaffListResponse {
  success: boolean;
  message?: string;
  data: Staff[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ApiResponseWithData<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface StaffState {
  currentStaff: Staff | null;
  staffList: Staff[];
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}