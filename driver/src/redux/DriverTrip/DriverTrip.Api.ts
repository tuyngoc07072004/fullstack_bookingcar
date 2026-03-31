import axios from 'axios';
import { getApiUrl } from '../../utils/dbUrl';
import {
  DriverTrip,
  DriverTripStats,
  DriverStatusResponse,
  ConfirmTripPayload,
  ConfirmTripResponse,
  CompleteTripResponse,
  ApiResponse
} from '../../types/DriverTrip.types';

const getAuthToken = (): string | null => {
  return localStorage.getItem('driverToken') || sessionStorage.getItem('driverToken');
};

const apiClient = axios.create({
  baseURL: getApiUrl(''),
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('driverToken');
      sessionStorage.removeItem('driverToken');
      window.location.href = '/driver/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Lấy danh sách chuyến đi của tài xế
 * GET /api/driverTrip/:driverId/trips (khớp driverTrip.router.js)
 */
export const getDriverTrips = async (driverId: string): Promise<DriverTrip[]> => {
  try {
    const response = await apiClient.get<ApiResponse<DriverTrip[]>>(`/driverTrip/${driverId}/trips`);
    
    // ✅ FIX: Handle ApiResponse format - data nằm trong response.data.data
    // Response từ server: { success: true, data: [...trips], message: '...' }
    // Nên lấy response.data.data thay vì response.data
    const trips = response.data.data || [];
    
    console.log(`✅ Fetched ${trips.length} trips for driver ${driverId}`);
    return trips;
  } catch (error: any) {
    console.error('❌ Lỗi lấy danh sách chuyến:', error);
    throw error.response?.data || { error: error.message };
  }
};

/**
 * Lấy thống kê của tài xế
 * GET /api/driverTrip/:driverId/stats (khớp driverTrip.router.js)
 */
export const getDriverTripStats = async (driverId: string): Promise<DriverTripStats> => {
  try {
    const response = await apiClient.get<ApiResponse<DriverTripStats>>(`/driverTrip/${driverId}/stats`);
    
    // ✅ FIX: Handle ApiResponse format - data nằm trong response.data.data
    // Response từ server: { success: true, data: { totalTrips, completedTrips, earnings, rating }, message: '...' }
    const stats = response.data.data || {
      totalTrips: 0,
      completedTrips: 0,
      earnings: 0,
      rating: 0
    };
    
    console.log(`✅ Fetched stats for driver ${driverId}:`, stats);
    return stats;
  } catch (error: any) {
    console.error('❌ Lỗi lấy thống kê:', error);
    throw error.response?.data || { error: error.message };
  }
};

/**
 * Xác nhận nhận chuyến (tài xế confirm)
 * PUT /api/driverTrip/confirm-trip
 */
export const confirmTrip = async (payload: ConfirmTripPayload): Promise<ConfirmTripResponse> => {
  try {
    const response = await apiClient.put<ApiResponse<ConfirmTripResponse>>(
      '/driverTrip/confirm-trip',
      payload
    );
    
    // ✅ Response format: { success: true, data: {...}, message: '...' }
    const result = response.data.data!;
    
    console.log(`✅ Confirmed trip:`, result);
    return result;
  } catch (error: any) {
    console.error('❌ Lỗi xác nhận chuyến:', error);
    throw error.response?.data || { error: error.message };
  }
};

/**
 * Hoàn thành chuyến đi
 * PUT /api/driverTrip/complete-trip/:bookingId
 */
export const completeTrip = async (bookingId: string): Promise<CompleteTripResponse> => {
  try {
    const response = await apiClient.put<ApiResponse<CompleteTripResponse>>(
      `/driverTrip/complete-trip/${bookingId}`
    );
    
    // ✅ Response format: { success: true, data: {...}, message: '...' }
    const result = response.data.data!;
    
    console.log(`✅ Completed trip:`, result);
    return result;
  } catch (error: any) {
    console.error('❌ Lỗi hoàn thành chuyến:', error);
    throw error.response?.data || { error: error.message };
  }
};

/**
 * Lấy trạng thái hiện tại của tài xế (lightweight polling)
 * GET /api/driverTrip/status
 * 
 * ✅ FIX: Sửa response parsing để handle ApiResponse format
 */
export const getDriverStatus = async (): Promise<DriverStatusResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<DriverStatusResponse>>('/driverTrip/status');
    
    // ✅ FIX: Handle ApiResponse format - data nằm trong response.data.data
    // Response từ server: { success: true, data: { id, status, name, role, updated_at }, message: '...' }
    const statusData = response.data.data!;
    
    return statusData;
  } catch (error: any) {
    console.error('❌ Lỗi lấy trạng thái tài xế:', error);
    throw error.response?.data || { error: error.message };
  }
};