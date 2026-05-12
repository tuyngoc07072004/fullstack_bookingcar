import { getApiUrl } from '../../utils/dbUrl';
import { 
  Staff, 
  StaffLoginPayload, 
  StaffRegisterPayload, 
  StaffAuthResponse,
  StaffResponse,
  StaffListResponse,
  ApiResponse,
  ApiResponseWithData
} from '../../types/Staff.types';

export const staffApi = {
  register: async (payload: StaffRegisterPayload): Promise<{ token: string; staff: Staff }> => {
    try {
      const response = await fetch(getApiUrl('/staff/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      const data: StaffAuthResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      if (!data.data) {
        throw new Error('Invalid response format');
      }
      
      return {
        token: data.data.token,
        staff: {
          _id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email,
          username: data.data.username,
          role: data.data.role || 'staff',
          created_at: new Date().toISOString(),
        }
      };
    } catch (error) {
      // Register error occurred
      throw error;
    }
  },

  login: async (payload: StaffLoginPayload): Promise<{ token: string; staff: Staff }> => {
    try {
      // Logging in staff
      
      const response = await fetch(getApiUrl('/staff/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Quan trọng: để gửi/nhận cookie
      });
      
      const data: StaffAuthResponse = await response.json();
      // Login response received
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (!data.data) {
        throw new Error('Invalid response format');
      }
      
      // Lưu token và staff info vào localStorage
      localStorage.setItem('staffToken', data.data.token);
      localStorage.setItem('staffInfo', JSON.stringify({
        id: data.data.id,
        name: data.data.name,
        phone: data.data.phone,
        email: data.data.email,
        username: data.data.username,
        role: data.data.role || 'staff'
      }));
      
      return {
        token: data.data.token,
        staff: {
          _id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email,
          username: data.data.username,
          role: data.data.role || 'staff',
          created_at: new Date().toISOString(),
        }
      };
    } catch (error) {
      // Login error occurred
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Logging out staff
      
      const response = await fetch(getApiUrl('/staff/logout'), {
        method: 'POST',
        credentials: 'include', // Quan trọng: để gửi cookie
      });
      
      const data: ApiResponse = await response.json();
      // Logout response received
      
      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }
      
      // Xóa dữ liệu trong localStorage
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffInfo');
      
      // Logout successful
    } catch (error) {
      // Logout error occurred
      // Vẫn xóa localStorage ngay cả khi API lỗi
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffInfo');
      throw error;
    }
  },

  getCurrentStaff: async (token?: string): Promise<Staff> => {
    try {
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/staff/me'), {
        headers,
        credentials: 'include',
      });
      
      const data: StaffResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch staff');
      }
      
      return data.data;
    } catch (error) {
      // Get current staff error occurred
      throw error;
    }
  },

  getAllStaff: async (token?: string): Promise<Staff[]> => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl('/staff'), {
        headers,
        credentials: 'include',
      });
      const data: StaffListResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch staff list');
      }
      return data.data || [];
    } catch (error) {
      // Get all staff error occurred
      throw error;
    }
  },

  updateStaff: async (id: string, data: Partial<Staff>, token?: string): Promise<Staff> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/staff/${id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      const result: StaffResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update staff');
      }
      
      return result.data;
    } catch (error) {
      // Update staff error occurred
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string, token?: string): Promise<void> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/staff/change-password'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });
      
      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      // Change password error occurred
      throw error;
    }
  },

  requestPasswordChange: async (method: 'email' | 'sms', token?: string): Promise<{ otpId: string; expiresAt: string; contact: string }> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/staff/request-password-change'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ method }),
      credentials: 'include',
    });

    const data: ApiResponseWithData<{ otpId: string; expiresAt: string; contact: string }> = await response.json();

    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || 'Gửi OTP thất bại');
    }

    return data.data;
  },

  verifyOtp: async (otpId: string, otp: string, token?: string): Promise<{ verificationToken: string }> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/staff/verify-otp'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ otpId, otp }),
      credentials: 'include',
    });

    const data: ApiResponseWithData<{ verificationToken: string }> = await response.json();

    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || 'Xác thực OTP thất bại');
    }

    return data.data;
  },

  changePasswordWithOtp: async (
    payload: { currentPassword: string; newPassword: string; verificationToken: string },
    token?: string
  ): Promise<void> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('/staff/change-password'), {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đổi mật khẩu thất bại');
    }
  },

  deleteStaff: async (id: string, token?: string): Promise<void> => {
    try {
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/staff/${id}`), {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete staff');
      }
    } catch (error) {
      // Delete staff error occurred
      throw error;
    }
  },
};