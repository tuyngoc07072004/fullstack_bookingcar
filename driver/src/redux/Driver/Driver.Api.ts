import { getApiUrl } from '../../utils/dbUrl';
import { 
  Driver, 
  DriverRegisterPayload, 
  DriverLoginPayload, 
  DriverLoginResponse,
  DriverUpdateProfilePayload,
  ChangePasswordPayload,
  ApiResponse 
} from '../../types/Driver.types';

export const driverApi = {
  // Đăng ký tài xế
  register: async (payload: DriverRegisterPayload): Promise<Driver> => {
    const response = await fetch(getApiUrl('/driver/driver-register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    
    const data: ApiResponse<Driver> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }
    
    return data.data as Driver;
  },

  // Đăng nhập tài xế
  login: async (payload: DriverLoginPayload): Promise<DriverLoginResponse> => {
    const response = await fetch(getApiUrl('/driver/driver-login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    
    const data: ApiResponse<DriverLoginResponse> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }
    
    return data.data as DriverLoginResponse;
  },

  logout: async (): Promise<void> => {
    const response = await fetch(getApiUrl('/driver/driver-logout'), {
      method: 'POST',
      credentials: 'include',
    });
    
    const data: ApiResponse<null> = await response.json();
    
    // Không throw error nếu logout fail vì vẫn muốn xóa localStorage
    if (!response.ok || !data.success) {
      console.warn('Logout API failed, but clearing local storage anyway');
    }
  },

  getCurrentDriver: async (): Promise<Driver> => {
    const response = await fetch(getApiUrl('/driver/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data: ApiResponse<Driver> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lấy thông tin thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Lấy thông tin thất bại');
    }
    
    return data.data as Driver;
  },

  // Lấy thông tin tài xế theo ID (dùng cho polling)
  getDriverById: async (driverId: string, token: string | null): Promise<Driver> => {
    const response = await fetch(getApiUrl(`/staff/drivers/${driverId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    
    const data: ApiResponse<Driver> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Lấy thông tin tài xế thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Lấy thông tin tài xế thất bại');
    }
    
    return data.data as Driver;
  },

  updateProfile: async (payload: DriverUpdateProfilePayload): Promise<Driver> => {
    const response = await fetch(getApiUrl('/driver/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<Driver> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật thông tin thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Cập nhật thông tin thất bại');
    }
    
    return data.data as Driver;
  },

  // Đổi mật khẩu
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    const response = await fetch(getApiUrl('/driver/change-password'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    
    const data: ApiResponse<null> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Đổi mật khẩu thất bại');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Đổi mật khẩu thất bại');
    }
  },
};