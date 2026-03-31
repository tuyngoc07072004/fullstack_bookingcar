import axios from 'axios';
import { getApiUrl } from '../../utils/dbUrl';
import { ApiResponse } from '../../types/DriverTrip.types';
import {
  CreateDriverSelfBookingRequest,
  CreateDriverSelfBookingResponse,
  DriverVehiclePayload
} from '../../types/DriverSelfTrip.types';

const getAuthToken = (): string | null =>
  localStorage.getItem('driverToken') || sessionStorage.getItem('driverToken');

const apiClient = axios.create({
  baseURL: getApiUrl(''),
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('driverToken');
      sessionStorage.removeItem('driverToken');
      window.location.href = '/#/driver-login';
    }
    return Promise.reject(error);
  }
);

export const getMyVehicle = async (): Promise<DriverVehiclePayload> => {
  try {
    const { data } = await apiClient.get<ApiResponse<DriverVehiclePayload>>('/driverTrip/me/vehicle');
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Không lấy được thông tin xe');
    }
    return data.data;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'Không lấy được thông tin xe');
  }
};

export const createDriverSelfBooking = async (
  payload: CreateDriverSelfBookingRequest
): Promise<CreateDriverSelfBookingResponse> => {
  try {
    const { data } = await apiClient.post<ApiResponse<CreateDriverSelfBookingResponse>>(
      '/driverTrip/self-booking',
      payload
    );
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Không tạo được chuyến');
    }
    return data.data;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'Không tạo được chuyến');
  }
};
