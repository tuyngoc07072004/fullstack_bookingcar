// src/api/DriverManagement.Api.ts
import { getApiUrl } from '../../utils/dbUrl';
import { Driver, ApiResponse } from '../../types/Driver.types';

const API_URL = getApiUrl('/staff');

export interface DriverManagementResponse {
  success: boolean;
  message: string;
  data: Driver[];
}

export interface SingleDriverResponse {
  success: boolean;
  message: string;
  data: Driver;
}

export interface UpdateStatusPayload {
  status: 'active' | 'inactive' | 'busy';
}

export interface SearchDriversResponse {
  success: boolean;
  message: string;
  data: Driver[];
}

export interface DriverManagementState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  error: string | null;
  searchResults: Driver[];
  filters: {
    status: string | null;
    searchKeyword: string;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Get all drivers
export const getAllDrivers = async (token: string): Promise<DriverManagementResponse> => {
  try {
    const response = await fetch(`${API_URL}/drivers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi lấy danh sách tài xế');
    }

    return data;
  } catch (error) {
    console.error('❌ Lỗi getAllDrivers:', error);
    throw error;
  }
};

// Get driver by ID
export const getDriverById = async (id: string, token: string): Promise<SingleDriverResponse> => {
  try {
    const response = await fetch(`${API_URL}/drivers/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi lấy thông tin tài xế');
    }

    return data;
  } catch (error) {
    console.error('❌ Lỗi getDriverById:', error);
    throw error;
  }
};

// Get drivers by status
export const getDriversByStatus = async (status: string, token: string): Promise<DriverManagementResponse> => {
  try {
    const response = await fetch(`${API_URL}/drivers/status/${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi lấy danh sách tài xế theo trạng thái');
    }

    return data;
  } catch (error) {
    console.error('❌ Lỗi getDriversByStatus:', error);
    throw error;
  }
};

// Update driver status
export const updateDriverStatus = async (
  id: string, 
  status: UpdateStatusPayload, 
  token: string
): Promise<SingleDriverResponse> => {
  try {
    const response = await fetch(`${API_URL}/drivers/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(status)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi cập nhật trạng thái tài xế');
    }

    return data;
  } catch (error) {
    console.error('❌ Lỗi updateDriverStatus:', error);
    throw error;
  }
};

// Search drivers
export const searchDrivers = async (keyword: string, token: string): Promise<SearchDriversResponse> => {
  try {
    const response = await fetch(`${API_URL}/drivers/search?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi tìm kiếm tài xế');
    }

    return data;
  } catch (error) {
    console.error('❌ Lỗi searchDrivers:', error);
    throw error;
  }
};