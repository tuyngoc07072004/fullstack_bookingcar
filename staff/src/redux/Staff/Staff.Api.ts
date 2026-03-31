import { getApiUrl } from '../../utils/dbUrl';
import { 
  Staff, 
  StaffLoginPayload, 
  StaffRegisterPayload, 
  StaffAuthResponse,
  StaffResponse,
  StaffListResponse,
  ApiResponse 
} from '../../types/Staff.types';

export const staffApi = {
  register: async (payload: StaffRegisterPayload): Promise<{ token: string; staff: Staff }> => {
    try {
      console.log('📝 Registering staff with:', payload);
      const response = await fetch(getApiUrl('/staff/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Quan trọng: để gửi/nhận cookie
      });
      
      const data: StaffAuthResponse = await response.json();
      console.log('📥 Register response:', data);
      
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
          created_at: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  },

  login: async (payload: StaffLoginPayload): Promise<{ token: string; staff: Staff }> => {
    try {
      console.log('🔐 Logging in with:', payload);
      
      const response = await fetch(getApiUrl('/staff/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Quan trọng: để gửi/nhận cookie
      });
      
      const data: StaffAuthResponse = await response.json();
      console.log('📥 Login response:', data);
      
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
        username: data.data.username
      }));
      
      return {
        token: data.data.token,
        staff: {
          _id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email,
          username: data.data.username,
          created_at: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      console.log('🚪 Logging out...');
      
      const response = await fetch(getApiUrl('/staff/logout'), {
        method: 'POST',
        credentials: 'include', // Quan trọng: để gửi cookie
      });
      
      const data: ApiResponse = await response.json();
      console.log('📥 Logout response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }
      
      // Xóa dữ liệu trong localStorage
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffInfo');
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
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
      console.error('❌ Get current staff error:', error);
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
      console.error('❌ Get all staff error:', error);
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
      console.error('❌ Update staff error:', error);
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
      console.error('❌ Change password error:', error);
      throw error;
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
      console.error('❌ Delete staff error:', error);
      throw error;
    }
  },
};