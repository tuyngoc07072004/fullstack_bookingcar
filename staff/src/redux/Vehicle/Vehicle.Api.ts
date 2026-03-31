import { getApiUrl } from '../../utils/dbUrl';
import {
  Vehicle,
  VehicleFormData,
  VehicleUpdatePayload,
  VehicleStatusUpdatePayload,
  VehicleStats,
  VehicleSearchParams,
  VehicleSearchResponse,
  VehicleFilters,
  ApiResponse,
  VehicleStatus,
  VehicleSeatCount,
} from '../../types/Vehicle.types';

const transformVehicle = (vehicle: any): Vehicle => {
  return {
    ...vehicle,
    _id: vehicle._id || vehicle.id,
    id: vehicle._id || vehicle.id, 
    created_at: vehicle.created_at || vehicle.createdAt,
    updated_at: vehicle.updated_at || vehicle.updatedAt,
  };
};

const transformVehicles = (vehicles: any[]): Vehicle[] => {
  if (!Array.isArray(vehicles)) return [];
  return vehicles.map(transformVehicle);
};

export const vehicleApi = {
 
  addVehicle: async (payload: VehicleFormData, token?: string): Promise<Vehicle> => {
    if (!token) {
      throw new Error('Vui lòng đăng nhập lại để thêm xe');
    }

    const response = await fetch(getApiUrl('/vehicles'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Thêm xe thất bại');
    }

    return transformVehicle(data.data);
  },

 
  getAllVehicles: async (token?: string): Promise<Vehicle[]> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/vehicles'), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<any[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lấy danh sách xe thất bại');
    }

   
    const vehicles = data.data || [];
    return transformVehicles(vehicles);
  },

 
  getVehicleById: async (id: string, token?: string): Promise<Vehicle> => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('ID xe không hợp lệ');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(`/vehicles/${id}`), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lấy thông tin xe thất bại');
    }

    return transformVehicle(data.data);
  },

 
  getVehiclesByStatus: async (status: VehicleStatus, token?: string): Promise<Vehicle[]> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(`/vehicles/status/${status}`), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<any[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lấy danh sách xe theo trạng thái thất bại');
    }

   
    const vehicles = data.data || [];
    return transformVehicles(vehicles);
  },

 
  getVehiclesBySeats: async (seats: VehicleSeatCount, token?: string): Promise<Vehicle[]> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(`/vehicles/seats/${seats}`), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<any[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lấy danh sách xe theo số chỗ thất bại');
    }

   
    const vehicles = data.data || [];
    return transformVehicles(vehicles);
  },

 
  searchVehicles: async (params: VehicleSearchParams, token?: string): Promise<VehicleSearchResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.status) queryParams.append('status', params.status);
    if (params.seats) queryParams.append('seats', params.seats.toString());
    if (params.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(`/vehicles/search?${queryParams}`), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: VehicleSearchResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Tìm kiếm xe thất bại');
    }

   
    if (data.data && Array.isArray(data.data)) {
      data.data = transformVehicles(data.data);
    } else {
      data.data = [];
    }

    return data;
  },

 
  getVehiclesByFilters: async (filters: VehicleFilters, token?: string): Promise<Vehicle[]> => {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.seats) queryParams.append('seats', filters.seats.toString());
    if (filters.vehicle_type) queryParams.append('vehicle_type', filters.vehicle_type);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(`/vehicles/filter?${queryParams}`), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<any[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lọc xe thất bại');
    }

   
    const vehicles = data.data || [];
    return transformVehicles(vehicles);
  },

 
  updateVehicle: async (id: string, payload: VehicleUpdatePayload, token?: string): Promise<Vehicle> => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('ID xe không hợp lệ');
    }

    if (!token) {
      throw new Error('Vui lòng đăng nhập lại để cập nhật xe');
    }

    const response = await fetch(getApiUrl(`/vehicles/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Cập nhật xe thất bại');
    }

    return transformVehicle(data.data);
  },

 
  updateVehicleStatus: async (id: string, payload: VehicleStatusUpdatePayload, token?: string): Promise<Vehicle> => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('ID xe không hợp lệ');
    }

    if (!token) {
      throw new Error('Vui lòng đăng nhập lại để cập nhật trạng thái');
    }

    const response = await fetch(getApiUrl(`/vehicles/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Cập nhật trạng thái xe thất bại');
    }

    return transformVehicle(data.data);
  },

 
  deleteVehicle: async (id: string, token?: string): Promise<{ _id: string; vehicle_name: string; license_plate: string }> => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('ID xe không hợp lệ');
    }

    if (!token) {
      throw new Error('Vui lòng đăng nhập lại để xóa xe');
    }

    const response = await fetch(getApiUrl(`/vehicles/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Xóa xe thất bại');
    }

    const result = data.data;
    return {
      _id: result._id || result.id,
      vehicle_name: result.vehicle_name,
      license_plate: result.license_plate,
    };
  },

 
  getVehicleStats: async (token?: string): Promise<VehicleStats> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/vehicles/stats'), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<VehicleStats> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Lấy thống kê xe thất bại');
    }
    
    return data.data as VehicleStats;
  },
};